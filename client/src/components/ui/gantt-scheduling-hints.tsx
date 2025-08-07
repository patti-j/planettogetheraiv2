import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export interface SchedulingHint {
  operationId: number;
  type: 'conflict' | 'optimization' | 'warning' | 'info' | 'success' | 'critical-path';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  position?: { x: number; y: number };
  suggestion?: string;
}

interface GanttSchedulingHintsProps {
  hints: SchedulingHint[];
  getOperationPosition: (operationId: number) => { x: number; y: number; width: number; height: number } | null;
  onHintClick?: (hint: SchedulingHint) => void;
  className?: string;
}

export default function GanttSchedulingHints({
  hints,
  getOperationPosition,
  onHintClick,
  className
}: GanttSchedulingHintsProps) {
  
  const getHintIcon = (hint: SchedulingHint) => {
    switch (hint.type) {
      case 'conflict':
        return <AlertTriangle className="w-4 h-4" />;
      case 'optimization':
        return <TrendingUp className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'critical-path':
        return <Clock className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };
  
  const getHintColor = (hint: SchedulingHint) => {
    const severityColors = {
      critical: 'bg-red-500 text-white border-red-600',
      high: 'bg-orange-500 text-white border-orange-600',
      medium: 'bg-yellow-500 text-white border-yellow-600',
      low: 'bg-blue-500 text-white border-blue-600'
    };
    
    return severityColors[hint.severity];
  };
  
  return (
    <div className={cn('absolute inset-0 pointer-events-none z-20', className)}>
      {hints.map((hint, index) => {
        const position = hint.position || getOperationPosition(hint.operationId);
        if (!position) return null;
        
        return (
          <div
            key={`hint-${hint.operationId}-${index}`}
            className={cn(
              'absolute flex items-start gap-1 p-2 rounded-md shadow-lg border pointer-events-auto cursor-pointer transition-all hover:scale-105',
              getHintColor(hint)
            )}
            style={{
              left: position.x + (position.width || 0) + 5,
              top: position.y - 10,
              maxWidth: '250px',
              zIndex: hint.severity === 'critical' ? 30 : 20
            }}
            onClick={() => onHintClick?.(hint)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getHintIcon(hint)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">
                {hint.message}
              </div>
              {hint.suggestion && (
                <div className="text-xs mt-1 opacity-90">
                  💡 {hint.suggestion}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Utility function to generate scheduling hints based on operations
export function generateSchedulingHints(
  operations: any[],
  resources: any[],
  links?: any[]
): SchedulingHint[] {
  const hints: SchedulingHint[] = [];
  
  // Check for resource conflicts
  const resourceSchedule = new Map<number, Array<{ start: Date; end: Date; opId: number }>>();
  
  operations.forEach(op => {
    if (!op.startTime || !op.endTime || !op.workCenterId) return;
    
    const start = new Date(op.startTime);
    const end = new Date(op.endTime);
    
    if (!resourceSchedule.has(op.workCenterId)) {
      resourceSchedule.set(op.workCenterId, []);
    }
    
    const schedule = resourceSchedule.get(op.workCenterId)!;
    
    // Check for overlaps
    const overlaps = schedule.filter(slot => 
      (start < slot.end && end > slot.start)
    );
    
    if (overlaps.length > 0) {
      hints.push({
        operationId: op.id,
        type: 'conflict',
        message: `Resource conflict detected`,
        severity: 'high',
        suggestion: 'Consider rescheduling or using alternative resource'
      });
    }
    
    schedule.push({ start, end, opId: op.id });
  });
  
  // Check for optimization opportunities
  operations.forEach(op => {
    if (!op.startTime || !op.endTime) return;
    
    const duration = new Date(op.endTime).getTime() - new Date(op.startTime).getTime();
    const expectedDuration = (op.processTime || 0) * 60 * 60 * 1000; // Convert hours to ms
    
    if (expectedDuration > 0 && duration > expectedDuration * 1.5) {
      hints.push({
        operationId: op.id,
        type: 'optimization',
        message: 'Operation scheduled longer than expected',
        severity: 'medium',
        suggestion: `Consider reducing to ${(expectedDuration / (60 * 60 * 1000)).toFixed(1)}h`
      });
    }
  });
  
  // Check for late starts
  const now = new Date();
  operations.forEach(op => {
    if (!op.startTime) return;
    
    const start = new Date(op.startTime);
    if (start < now && op.status === 'scheduled') {
      hints.push({
        operationId: op.id,
        type: 'warning',
        message: 'Operation should have started',
        severity: 'high',
        suggestion: 'Update status or reschedule'
      });
    }
  });
  
  // Mark critical path operations
  if (links && links.length > 0) {
    const criticalOps = links
      .filter(link => link.critical)
      .flatMap(link => [link.fromId, link.toId]);
    
    [...new Set(criticalOps)].forEach(opId => {
      hints.push({
        operationId: opId,
        type: 'critical-path',
        message: 'Critical path operation',
        severity: 'medium',
        suggestion: 'Delays will impact project completion'
      });
    });
  }
  
  return hints;
}