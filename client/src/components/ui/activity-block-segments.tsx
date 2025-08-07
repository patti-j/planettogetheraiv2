import React from 'react';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  Package, 
  Clock, 
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

export interface ActivitySegment {
  type: 'commitment' | 'material' | 'buffer' | 'progress' | 'priority' | 'quality';
  value: string | number;
  color?: string;
}

export interface ActivityBlockProps {
  id: number;
  name: string;
  jobName?: string;
  startTime: Date;
  endTime: Date;
  status: string;
  progress?: number;
  segments?: ActivitySegment[];
  labels?: string[];
  isSelected?: boolean;
  isFaded?: boolean;
  isDailyView?: boolean;
  onSelect?: () => void;
  className?: string;
}

const getSegmentColor = (segment: ActivitySegment): string => {
  switch (segment.type) {
    case 'commitment':
      switch (segment.value) {
        case 'estimate': return 'bg-gray-400';
        case 'planned': return 'bg-blue-400';
        case 'firm': return 'bg-green-500';
        case 'released': return 'bg-green-600';
        default: return 'bg-gray-300';
      }
    case 'material':
      switch (segment.value) {
        case 'available': return 'bg-green-500';
        case 'planned': return 'bg-yellow-500';
        case 'unknown': return 'bg-red-500';
        case 'firm': return 'bg-blue-500';
        default: return 'bg-gray-300';
      }
    case 'buffer':
      const penetration = Number(segment.value);
      if (penetration < 33) return 'bg-green-500';
      if (penetration < 66) return 'bg-yellow-500';
      if (penetration < 100) return 'bg-red-500';
      return 'bg-red-600'; // Late
    case 'progress':
      const prog = Number(segment.value);
      if (prog === 100) return 'bg-green-600';
      if (prog >= 75) return 'bg-green-500';
      if (prog >= 50) return 'bg-blue-500';
      if (prog >= 25) return 'bg-yellow-500';
      return 'bg-gray-400';
    case 'priority':
      switch (segment.value) {
        case 'critical': return 'bg-red-600';
        case 'high': return 'bg-orange-500';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-blue-400';
        default: return 'bg-gray-400';
      }
    case 'quality':
      switch (segment.value) {
        case 'passed': return 'bg-green-500';
        case 'failed': return 'bg-red-500';
        case 'pending': return 'bg-yellow-500';
        case 'in-progress': return 'bg-blue-500';
        default: return 'bg-gray-400';
      }
    default:
      return segment.color || 'bg-gray-400';
  }
};

const getSegmentIcon = (segment: ActivitySegment) => {
  switch (segment.type) {
    case 'material':
      if (segment.value === 'unknown') return <AlertCircle className="w-3 h-3" />;
      if (segment.value === 'available') return <CheckCircle className="w-3 h-3" />;
      return <Package className="w-3 h-3" />;
    case 'buffer':
      const penetration = Number(segment.value);
      if (penetration >= 66) return <AlertTriangle className="w-3 h-3" />;
      if (penetration >= 33) return <Clock className="w-3 h-3" />;
      return null;
    case 'quality':
      if (segment.value === 'failed') return <XCircle className="w-3 h-3" />;
      if (segment.value === 'passed') return <CheckCircle className="w-3 h-3" />;
      return null;
    default:
      return null;
  }
};

export default function ActivityBlockSegments({
  id,
  name,
  jobName,
  startTime,
  endTime,
  status,
  progress = 0,
  segments = [],
  labels = [],
  isSelected = false,
  isFaded = false,
  isDailyView = false,
  onSelect,
  className
}: ActivityBlockProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  // Calculate segment heights
  const segmentHeight = segments.length > 0 ? Math.max(4, 20 / segments.length) : 0;

  return (
    <div
      className={cn(
        'relative rounded border cursor-pointer transition-all',
        'hover:shadow-md hover:z-10',
        isSelected && 'ring-2 ring-blue-500 shadow-lg z-20',
        isFaded && 'opacity-30',
        isDailyView && 'min-h-[60px]',
        status === 'completed' && 'border-green-500',
        status === 'in-progress' && 'border-blue-500 animate-pulse',
        status === 'delayed' && 'border-red-500',
        status === 'scheduled' && 'border-gray-300',
        className
      )}
      onClick={onSelect}
      data-operation-id={id}
    >
      {/* Segments Section */}
      {segments.length > 0 && (
        <div className="absolute top-0 left-0 right-0">
          {segments.map((segment, index) => (
            <div
              key={`${segment.type}-${index}`}
              className={cn(
                'relative flex items-center justify-center text-white',
                getSegmentColor(segment)
              )}
              style={{ height: `${segmentHeight}px` }}
              title={`${segment.type}: ${segment.value}`}
            >
              {getSegmentIcon(segment)}
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div 
        className={cn(
          'relative p-2 bg-white dark:bg-gray-800',
          segments.length > 0 && `mt-[${segments.length * segmentHeight}px]`
        )}
        style={{ marginTop: segments.length > 0 ? `${segments.length * segmentHeight}px` : 0 }}
      >
        {/* Progress Bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
            <div 
              className="h-full bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Labels */}
        <div className="space-y-1">
          {labels.includes('job') && jobName && (
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
              {jobName}
            </div>
          )}
          
          {labels.includes('operation') && (
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {name}
            </div>
          )}
          
          {labels.includes('time') && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {formatTime(startTime)} - {formatTime(endTime)}
            </div>
          )}
          
          {labels.includes('duration') && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {formatDuration(startTime, endTime)}
            </div>
          )}
          
          {labels.includes('progress') && progress > 0 && (
            <div className="text-xs font-medium text-green-600 dark:text-green-400">
              {progress}% Complete
            </div>
          )}
          
          {labels.includes('status') && (
            <div className={cn(
              'text-xs font-medium',
              status === 'completed' && 'text-green-600',
              status === 'in-progress' && 'text-blue-600',
              status === 'delayed' && 'text-red-600',
              status === 'scheduled' && 'text-gray-600'
            )}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          )}
        </div>

        {/* Daily View Mode - Expand to full day width */}
        {isDailyView && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-900/50">
            <div className="text-center">
              <div className="font-semibold">{name}</div>
              <div className="text-xs text-gray-600">{jobName}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}