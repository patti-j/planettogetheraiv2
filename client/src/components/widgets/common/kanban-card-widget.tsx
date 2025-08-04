import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Calendar, 
  User, 
  Building2, 
  Wrench,
  LucideIcon
} from 'lucide-react';
import { useDrag } from 'react-dnd';

interface KanbanCardAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface KanbanCardField {
  key: string;
  label: string;
  value: any;
  render?: (value: any) => React.ReactNode;
  icon?: LucideIcon;
}

interface KanbanCardWidgetProps {
  // Core data
  id: number | string;
  title: string;
  subtitle?: string;
  description?: string;
  
  // Status and priority
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  
  // Fields to display
  fields?: KanbanCardField[];
  
  // Actions
  actions?: KanbanCardAction[];
  onEdit?: () => void;
  onViewDetails?: () => void;
  
  // Drag and drop
  dragType?: string;
  dragData?: any;
  swimLaneField?: string;
  index?: number;
  
  // Visual configuration
  showPriority?: boolean;
  showStatus?: boolean;
  compact?: boolean;
  
  // Custom styling
  className?: string;
  color?: string;
}

const priorityColors = {
  low: 'bg-gray-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  on_hold: 'bg-orange-100 text-orange-800'
};

export default function KanbanCardWidget({
  id,
  title,
  subtitle,
  description,
  status,
  priority = 'medium',
  fields = [],
  actions = [],
  onEdit,
  onViewDetails,
  dragType = 'card',
  dragData,
  swimLaneField = 'status',
  index = 0,
  showPriority = true,
  showStatus = true,
  compact = false,
  className = '',
  color
}: KanbanCardWidgetProps) {
  
  const getSourceColumnId = () => {
    if (dragData) {
      switch (swimLaneField) {
        case 'status':
          return dragData.status || status;
        case 'priority':
          return dragData.priority || priority;
        case 'assignedTo':
          return dragData.assignedTo || 'unassigned';
        default:
          return status || 'pending';
      }
    }
    return status || 'pending';
  };

  const [{ isDragging }, drag] = useDrag({
    type: dragType,
    item: { 
      id, 
      type: dragType, 
      sourceColumnId: getSourceColumnId(), 
      index,
      data: dragData 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (draggedItem, monitor) => {
      // Prevent any default behavior that might cause screen changes
      if (monitor.didDrop()) {
        return;
      }
    },
  });

  const defaultActions = [
    ...(onViewDetails ? [{
      icon: Eye,
      label: 'View Details',
      onClick: onViewDetails
    }] : []),
    ...(onEdit ? [{
      icon: Edit,
      label: 'Edit',
      onClick: onEdit
    }] : []),
    ...actions
  ];

  const renderField = (field: KanbanCardField) => {
    const Icon = field.icon;
    const displayValue = field.render ? field.render(field.value) : field.value;
    
    return (
      <div key={field.key} className="flex items-center text-xs text-gray-500">
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        <span className="truncate">
          {field.label}: {displayValue}
        </span>
      </div>
    );
  };

  return (
    <div
      ref={drag}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${
        compact ? 'p-2' : 'p-3'
      } mb-2 cursor-move hover:shadow-md transition-shadow relative ${
        isDragging ? 'opacity-50 rotate-3' : ''
      } ${className}`}
      style={color ? { borderLeftColor: color, borderLeftWidth: '4px' } : {}}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm flex-1 pr-8">
          {title}
        </h4>
        
        {defaultActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {defaultActions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={action.onClick}
                  className={action.variant === 'destructive' ? 'text-red-600' : ''}
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-gray-600 mb-2">{subtitle}</p>
      )}

      {/* Content */}
      <div className="space-y-2">
        {/* Status and Priority badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showStatus && status && (
              <Badge className={`text-xs ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                {status.replace('_', ' ')}
              </Badge>
            )}
          </div>
          {showPriority && (
            <Badge className={`text-xs ${priorityColors[priority]} text-white flex-shrink-0`}>
              {priority}
            </Badge>
          )}
        </div>
        
        {/* Custom fields */}
        {fields.map(field => renderField(field))}
        
        {/* Description */}
        {description && !compact && (
          <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
        )}
      </div>
      
      {/* Quick view button */}
      {onViewDetails && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 z-10" 
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}