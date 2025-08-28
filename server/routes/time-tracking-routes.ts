import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { db } from "../db";
import { timeClockEntries, teamClockEntries, teamMemberClockDetails, laborCostSummary } from "@shared/schema";
import { eq, and, isNull, gte, lte, desc, sql } from "drizzle-orm";

// Define storage interface
interface TimeTrackingStorage {
  // Clock in/out operations
  clockIn(userId: number, operationId?: number, jobId?: number): Promise<any>;
  clockOut(entryId: number, userId: number): Promise<any>;
  getActiveClockEntry(userId: number): Promise<any>;
  
  // Team operations  
  teamClockIn(supervisorId: number, teamMembers: number[], operationId: number, jobId?: number): Promise<any>;
  teamClockOut(teamEntryId: number, supervisorId: number): Promise<any>;
  
  // Queries
  getUserTimeEntries(userId: number, startDate?: Date, endDate?: Date): Promise<any[]>;
  getOperationTimeEntries(operationId: number, date?: Date): Promise<any[]>;
  getLaborCostSummary(jobId?: number, operationId?: number, date?: Date): Promise<any[]>;
}

export function registerTimeTrackingRoutes(app: Express) {
  
  // Clock In - Individual
  app.post("/api/time-tracking/clock-in", async (req, res) => {
    try {
      const { operationId, jobId, location, notes } = req.body;
      
      // Get userId from session/auth (simplified for demo)
      const userId = 1; // In real app, this would come from authenticated session
      
      // Check if user already has active clock entry
      const activeEntry = await db.select()
        .from(timeClockEntries)
        .where(and(
          eq(timeClockEntries.userId, userId),
          eq(timeClockEntries.status, 'active'),
          isNull(timeClockEntries.clockOutTime)
        ))
        .limit(1);
      
      if (activeEntry.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: "User already clocked in",
          activeEntry: activeEntry[0] 
        });
      }
      
      // Get user's hourly rate (would typically come from users table or employee records)
      const hourlyRate = 25.00; // Default rate, should be fetched from user profile
      
      // Create new clock entry
      const [newEntry] = await db.insert(timeClockEntries)
        .values({
          userId,
          operationId,
          jobId,
          location,
          notes,
          hourlyRate: hourlyRate.toString(),
          status: 'active',
          shiftType: determineShiftType(new Date()),
        })
        .returning();
      
      res.json({ 
        success: true, 
        message: "Clocked in successfully",
        entry: newEntry 
      });
    } catch (error) {
      console.error("Error clocking in:", error);
      res.status(500).json({ success: false, message: "Failed to clock in" });
    }
  });
  
  // Clock Out - Individual
  app.post("/api/time-tracking/clock-out", async (req, res) => {
    try {
      const { entryId, userId, breakMinutes = 0, notes } = req.body;
      
      // Get the active clock entry
      const [entry] = await db.select()
        .from(timeClockEntries)
        .where(and(
          eq(timeClockEntries.id, entryId),
          eq(timeClockEntries.userId, userId),
          eq(timeClockEntries.status, 'active')
        ))
        .limit(1);
      
      if (!entry) {
        return res.status(404).json({ 
          success: false,
          message: "No active clock entry found" 
        });
      }
      
      const clockOutTime = new Date();
      const clockInTime = new Date(entry.clockInTime);
      const totalMinutes = (clockOutTime.getTime() - clockInTime.getTime()) / 1000 / 60;
      const workMinutes = totalMinutes - breakMinutes;
      const totalHours = workMinutes / 60;
      
      // Calculate overtime (assuming 8 hours regular time)
      const regularHours = Math.min(totalHours, 8);
      const overtimeHours = Math.max(0, totalHours - 8);
      const overtimeRate = 1.5; // 1.5x for overtime
      
      // Calculate labor cost
      const hourlyRate = parseFloat(entry.hourlyRate || '0');
      const regularCost = regularHours * hourlyRate;
      const overtimeCost = overtimeHours * hourlyRate * overtimeRate;
      const totalLaborCost = regularCost + overtimeCost;
      
      // Update the entry
      const [updatedEntry] = await db.update(timeClockEntries)
        .set({
          clockOutTime,
          breakMinutes,
          totalHours: totalHours.toFixed(2),
          overtimeHours: overtimeHours.toFixed(2),
          overtimeRate: overtimeRate.toString(),
          laborCost: totalLaborCost.toFixed(2),
          status: 'closed',
          notes: entry.notes ? `${entry.notes}\n${notes || ''}` : notes,
          updatedAt: new Date(),
        })
        .where(eq(timeClockEntries.id, entryId))
        .returning();
      
      // Update labor cost summary
      await updateLaborCostSummary(entry.jobId, entry.operationId, clockInTime);
      
      res.json({ 
        success: true, 
        message: "Clocked out successfully",
        entry: updatedEntry,
        summary: {
          totalHours: totalHours.toFixed(2),
          regularHours: regularHours.toFixed(2),
          overtimeHours: overtimeHours.toFixed(2),
          totalCost: totalLaborCost.toFixed(2)
        }
      });
    } catch (error) {
      console.error("Error clocking out:", error);
      res.status(500).json({ success: false, message: "Failed to clock out" });
    }
  });
  
  // Team Clock In
  app.post("/api/time-tracking/team-clock-in", async (req, res) => {
    try {
      const { teamMembers, operationId, jobId, teamName, location, notes } = req.body;
      
      // Get supervisorId from session/auth (simplified for demo)
      const supervisorId = 1; // In real app, this would come from authenticated session
      
      if (!teamMembers || teamMembers.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: "No team members specified" 
        });
      }
      
      // Create team clock entry
      const [teamEntry] = await db.insert(teamClockEntries)
        .values({
          supervisorId,
          teamMembers: JSON.stringify(teamMembers),
          operationId,
          jobId,
          teamName: teamName || `Team ${new Date().toISOString().split('T')[0]}`,
          location,
          notes,
          status: 'active',
        })
        .returning();
      
      // Create individual entries for each team member
      const memberEntries = [];
      for (const memberId of teamMembers) {
        // Get member's hourly rate (would typically come from users table)
        const hourlyRate = 25.00; // Default rate, should be fetched
        
        const [memberEntry] = await db.insert(teamMemberClockDetails)
          .values({
            teamClockEntryId: teamEntry.id,
            userId: memberId,
            clockInTime: teamEntry.clockInTime,
            hourlyRate: hourlyRate.toString(),
            status: 'active',
          })
          .returning();
        
        memberEntries.push(memberEntry);
      }
      
      res.json({ 
        success: true, 
        message: `Team of ${teamMembers.length} members clocked in successfully`,
        teamEntry,
        memberEntries
      });
    } catch (error) {
      console.error("Error with team clock in:", error);
      res.status(500).json({ success: false, message: "Failed to clock in team" });
    }
  });
  
  // Team Clock Out
  app.post("/api/time-tracking/team-clock-out", async (req, res) => {
    try {
      const { teamEntryId, supervisorId, memberBreaks = {} } = req.body;
      
      // Get team entry
      const [teamEntry] = await db.select()
        .from(teamClockEntries)
        .where(and(
          eq(teamClockEntries.id, teamEntryId),
          eq(teamClockEntries.supervisorId, supervisorId),
          eq(teamClockEntries.status, 'active')
        ))
        .limit(1);
      
      if (!teamEntry) {
        return res.status(404).json({ 
          success: false,
          message: "Team entry not found" 
        });
      }
      
      const clockOutTime = new Date();
      let totalTeamHours = 0;
      let totalTeamCost = 0;
      
      // Get all member details
      const memberDetails = await db.select()
        .from(teamMemberClockDetails)
        .where(eq(teamMemberClockDetails.teamClockEntryId, teamEntryId));
      
      // Update each member's clock out
      for (const member of memberDetails) {
        const breakMinutes = memberBreaks[member.userId] || 0;
        const clockInTime = new Date(member.clockInTime);
        const totalMinutes = (clockOutTime.getTime() - clockInTime.getTime()) / 1000 / 60;
        const workMinutes = totalMinutes - breakMinutes;
        const totalHours = workMinutes / 60;
        const hourlyRate = parseFloat(member.hourlyRate || '0');
        const laborCost = totalHours * hourlyRate;
        
        await db.update(teamMemberClockDetails)
          .set({
            clockOutTime,
            breakMinutes,
            totalHours: totalHours.toFixed(2),
            laborCost: laborCost.toFixed(2),
            status: 'closed',
          })
          .where(eq(teamMemberClockDetails.id, member.id));
        
        totalTeamHours += totalHours;
        totalTeamCost += laborCost;
      }
      
      // Update team entry
      const [updatedTeamEntry] = await db.update(teamClockEntries)
        .set({
          clockOutTime,
          totalTeamHours: totalTeamHours.toFixed(2),
          totalLaborCost: totalTeamCost.toFixed(2),
          status: 'closed',
          updatedAt: new Date(),
        })
        .where(eq(teamClockEntries.id, teamEntryId))
        .returning();
      
      // Update labor cost summary
      await updateLaborCostSummary(teamEntry.jobId, teamEntry.operationId, new Date(teamEntry.clockInTime));
      
      res.json({ 
        success: true, 
        message: "Team clocked out successfully",
        teamEntry: updatedTeamEntry,
        summary: {
          totalTeamHours: totalTeamHours.toFixed(2),
          totalTeamCost: totalTeamCost.toFixed(2),
          memberCount: memberDetails.length
        }
      });
    } catch (error) {
      console.error("Error with team clock out:", error);
      res.status(500).json({ success: false, message: "Failed to clock out team" });
    }
  });
  
  // Get active clock entries for a user
  app.get("/api/time-tracking/active/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const activeEntries = await db.select()
        .from(timeClockEntries)
        .where(and(
          eq(timeClockEntries.userId, userId),
          eq(timeClockEntries.status, 'active'),
          isNull(timeClockEntries.clockOutTime)
        ))
        .orderBy(desc(timeClockEntries.clockInTime));
      
      res.json({ 
        success: true,
        entries: activeEntries
      });
    } catch (error) {
      console.error("Error fetching active entries:", error);
      res.status(500).json({ success: false, message: "Failed to fetch active entries" });
    }
  });
  
  // Get time entries for a user
  app.get("/api/time-tracking/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { startDate, endDate } = req.query;
      
      let query = db.select()
        .from(timeClockEntries)
        .where(eq(timeClockEntries.userId, userId));
      
      if (startDate) {
        query = query.where(gte(timeClockEntries.clockInTime, new Date(startDate as string)));
      }
      
      if (endDate) {
        query = query.where(lte(timeClockEntries.clockInTime, new Date(endDate as string)));
      }
      
      const entries = await query.orderBy(desc(timeClockEntries.clockInTime));
      
      // Calculate totals
      let totalHours = 0;
      let totalCost = 0;
      
      entries.forEach(entry => {
        totalHours += parseFloat(entry.totalHours || '0');
        totalCost += parseFloat(entry.laborCost || '0');
      });
      
      res.json({ 
        success: true,
        entries,
        summary: {
          totalEntries: entries.length,
          totalHours: totalHours.toFixed(2),
          totalCost: totalCost.toFixed(2)
        }
      });
    } catch (error) {
      console.error("Error fetching user entries:", error);
      res.status(500).json({ success: false, message: "Failed to fetch user entries" });
    }
  });
  
  // Get labor cost summary
  app.get("/api/time-tracking/labor-summary", async (req, res) => {
    try {
      const { jobId, operationId, date } = req.query;
      
      let query = db.select()
        .from(laborCostSummary);
      
      if (jobId) {
        query = query.where(eq(laborCostSummary.jobId, parseInt(jobId as string)));
      }
      
      if (operationId) {
        query = query.where(eq(laborCostSummary.operationId, parseInt(operationId as string)));
      }
      
      if (date) {
        query = query.where(eq(laborCostSummary.date, new Date(date as string)));
      }
      
      const summary = await query.orderBy(desc(laborCostSummary.date));
      
      res.json({ 
        success: true,
        summary
      });
    } catch (error) {
      console.error("Error fetching labor summary:", error);
      res.status(500).json({ success: false, message: "Failed to fetch labor summary" });
    }
  });
}

// Helper functions
function determineShiftType(date: Date): string {
  const hour = date.getHours();
  const day = date.getDay();
  
  if (day === 0 || day === 6) return 'weekend';
  if (hour >= 6 && hour < 14) return 'day';
  if (hour >= 14 && hour < 22) return 'evening';
  return 'night';
}

async function updateLaborCostSummary(jobId: number | null, operationId: number | null, date: Date) {
  try {
    // This would aggregate all time entries for the given job/operation/date
    // and update the summary table
    // Implementation depends on specific business rules
  } catch (error) {
    console.error("Error updating labor cost summary:", error);
  }
}