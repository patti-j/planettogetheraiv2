import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, DollarSign, Activity, Calendar, Timer, UserCheck, Briefcase } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TimeEntry {
  id: number;
  userId: number;
  operationId?: number;
  jobId?: number;
  clockInTime: string;
  clockOutTime?: string;
  breakMinutes: number;
  totalHours?: string;
  laborCost?: string;
  status: string;
  location?: string;
  shiftType?: string;
  notes?: string;
}

interface TeamMember {
  id: number;
  name: string;
  department?: string;
  isSelected: boolean;
}

export default function TimeTracking() {
  const [activeView, setActiveView] = useState<"individual" | "team">("individual");
  const [selectedOperation, setSelectedOperation] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [breakMinutes, setBreakMinutes] = useState<number>(0);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);
  const [teamName, setTeamName] = useState<string>("");

  // Safe date formatting function
  const formatSafeDate = (dateString: string | null | undefined, formatString: string) => {
    if (!dateString) return 'No time';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid time';
      return format(date, formatString);
    } catch (error) {
      console.error('Date formatting error:', error, dateString);
      return 'Invalid time';
    }
  };

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Get active clock entry
  const { data: activeEntry, isLoading: loadingActive } = useQuery({
    queryKey: ['/api/time-tracking/active', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Get user's time entries
  const { data: timeEntries, isLoading: loadingEntries } = useQuery({
    queryKey: ['/api/time-tracking/user', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Get operations for dropdown
  const { data: operations } = useQuery({
    queryKey: ['/api/operations'],
  });

  // Get jobs for dropdown
  const { data: jobs } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Get users for team selection
  const { data: users } = useQuery({
    queryKey: ['/api/users-with-roles'],
  });

  // Clock In mutation
  const clockInMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/time-tracking/clock-in', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-tracking'] });
      toast({
        title: "Success",
        description: "Clocked in successfully",
      });
      // Clear form
      setNotes("");
      setLocation("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clock in",
        variant: "destructive",
      });
    }
  });

  // Clock Out mutation
  const clockOutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/time-tracking/clock-out', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-tracking'] });
      toast({
        title: "Success",
        description: `Clocked out successfully. Total hours: ${data.summary?.totalHours || 0}`,
      });
      setBreakMinutes(0);
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clock out",
        variant: "destructive",
      });
    }
  });

  // Team Clock In mutation
  const teamClockInMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/time-tracking/team-clock-in', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-tracking'] });
      toast({
        title: "Success",
        description: data.message || "Team clocked in successfully",
      });
      // Clear form
      setSelectedTeamMembers([]);
      setTeamName("");
      setNotes("");
      setLocation("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clock in team",
        variant: "destructive",
      });
    }
  });

  const handleClockIn = () => {
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    clockInMutation.mutate({
      userId: currentUser.id,
      operationId: selectedOperation ? parseInt(selectedOperation) : null,
      jobId: selectedJob ? parseInt(selectedJob) : null,
      location,
      notes,
    });
  };

  const handleClockOut = () => {
    if (!activeEntry || !currentUser?.id) {
      toast({
        title: "Error",
        description: "No active clock entry found",
        variant: "destructive",
      });
      return;
    }

    clockOutMutation.mutate({
      entryId: activeEntry.id,
      userId: currentUser.id,
      breakMinutes,
      notes,
    });
  };

  const handleTeamClockIn = () => {
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    if (selectedTeamMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please select team members",
        variant: "destructive",
      });
      return;
    }

    if (!selectedOperation) {
      toast({
        title: "Error",
        description: "Please select an operation",
        variant: "destructive",
      });
      return;
    }

    teamClockInMutation.mutate({
      supervisorId: currentUser.id,
      teamMembers: selectedTeamMembers,
      operationId: parseInt(selectedOperation),
      jobId: selectedJob ? parseInt(selectedJob) : null,
      teamName: teamName || undefined,
      location,
      notes,
    });
  };

  // Calculate elapsed time for active entry
  const getElapsedTime = () => {
    if (!activeEntry?.clockInTime) return "00:00:00";
    
    const start = new Date(activeEntry.clockInTime);
    const now = new Date();
    
    // Validate dates
    if (isNaN(start.getTime())) {
      console.error('Invalid clock in time:', activeEntry.clockInTime);
      return;
    }
    const diff = now.getTime() - start.getTime();
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(getElapsedTime());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeEntry]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="h-8 w-8" />
            Time Tracking
          </h1>
          <p className="text-muted-foreground mt-2">
            Track employee time for accurate labor costing
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={activeView === "individual" ? "default" : "outline"}
            onClick={() => setActiveView("individual")}
            className="gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Individual
          </Button>
          <Button
            variant={activeView === "team" ? "default" : "outline"}
            onClick={() => setActiveView("team")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Team
          </Button>
        </div>
      </div>

      {/* Active Clock Status */}
      {activeEntry && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Currently Clocked In
              </span>
              <Badge variant="default" className="bg-green-600">
                {elapsedTime}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Clock In Time</p>
                <p className="font-medium">
                  {formatSafeDate(activeEntry.clockInTime, 'h:mm a')}
                </p>
              </div>
              {activeEntry.operationId && (
                <div>
                  <p className="text-sm text-muted-foreground">Operation</p>
                  <p className="font-medium">Operation #{activeEntry.operationId}</p>
                </div>
              )}
              {activeEntry.location && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{activeEntry.location}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Shift Type</p>
                <Badge variant="secondary">{activeEntry.shiftType || 'Day'}</Badge>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="break-minutes">Break Minutes</Label>
                <Input
                  id="break-minutes"
                  type="number"
                  placeholder="Enter break duration in minutes"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="clock-out-notes">Notes (Optional)</Label>
                <Textarea
                  id="clock-out-notes"
                  placeholder="Add any notes about this shift..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
              
              <Button 
                onClick={handleClockOut}
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={clockOutMutation.isPending}
              >
                <Clock className="h-4 w-4 mr-2" />
                {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clock In Form */}
      {!activeEntry && activeView === "individual" && (
        <Card>
          <CardHeader>
            <CardTitle>Clock In</CardTitle>
            <CardDescription>Start tracking your work time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="operation">Operation (Optional)</Label>
                <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                  <SelectTrigger id="operation">
                    <SelectValue placeholder="Select an operation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {operations?.map((op: any) => (
                      <SelectItem key={op.id} value={op.id.toString()}>
                        {op.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="job">Job (Optional)</Label>
                <Select value={selectedJob} onValueChange={setSelectedJob}>
                  <SelectTrigger id="job">
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {jobs?.map((job: any) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter work location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Add any notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleClockIn}
              className="w-full"
              disabled={clockInMutation.isPending}
            >
              <Clock className="h-4 w-4 mr-2" />
              {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team Clock In Form */}
      {activeView === "team" && (
        <Card>
          <CardHeader>
            <CardTitle>Team Clock In</CardTitle>
            <CardDescription>Clock in multiple team members for an operation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name (Optional)</Label>
              <Input
                id="team-name"
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="team-operation">Operation *</Label>
              <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                <SelectTrigger id="team-operation">
                  <SelectValue placeholder="Select an operation" />
                </SelectTrigger>
                <SelectContent>
                  {operations?.map((op: any) => (
                    <SelectItem key={op.id} value={op.id.toString()}>
                      {op.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="team-job">Job (Optional)</Label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger id="team-job">
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {jobs?.map((job: any) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Select Team Members *</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {users?.map((user: any) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={selectedTeamMembers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeamMembers([...selectedTeamMembers, user.id]);
                        } else {
                          setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== user.id));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`user-${user.id}`} className="text-sm flex-1 cursor-pointer">
                      {user.username} - {user.department || 'No Department'}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTeamMembers.length} members selected
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="team-location">Location</Label>
                <Input
                  id="team-location"
                  placeholder="Enter work location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="team-notes">Notes</Label>
                <Input
                  id="team-notes"
                  placeholder="Add any notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleTeamClockIn}
              className="w-full"
              disabled={teamClockInMutation.isPending}
            >
              <Users className="h-4 w-4 mr-2" />
              {teamClockInMutation.isPending ? "Clocking In Team..." : "Clock In Team"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Time Entries</span>
            {timeEntries?.summary && (
              <div className="flex gap-4 text-sm">
                <Badge variant="secondary" className="gap-1">
                  <Timer className="h-3 w-3" />
                  {timeEntries.summary.totalHours} hours
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${timeEntries.summary.totalCost}
                </Badge>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEntries ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : !timeEntries?.entries || timeEntries.entries.length === 0 ? (
            <p className="text-muted-foreground">No time entries found</p>
          ) : (
            <div className="space-y-3">
              {timeEntries.entries.slice(0, 10).map((entry: TimeEntry) => (
                <div key={entry.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={entry.status === 'active' ? 'default' : 'secondary'}>
                          {entry.status}
                        </Badge>
                        {entry.shiftType && (
                          <Badge variant="outline">{entry.shiftType}</Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1">
                        <span className="font-medium">Clock In:</span>{' '}
                        {formatSafeDate(entry.clockInTime, 'MMM d, h:mm a')}
                      </p>
                      {entry.clockOutTime && (
                        <p className="text-sm">
                          <span className="font-medium">Clock Out:</span>{' '}
                          {formatSafeDate(entry.clockOutTime, 'h:mm a')}
                        </p>
                      )}
                      {entry.location && (
                        <p className="text-sm text-muted-foreground">
                          <Briefcase className="h-3 w-3 inline mr-1" />
                          {entry.location}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {entry.totalHours && (
                        <p className="font-medium">{entry.totalHours} hrs</p>
                      )}
                      {entry.laborCost && (
                        <p className="text-sm text-muted-foreground">${entry.laborCost}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}