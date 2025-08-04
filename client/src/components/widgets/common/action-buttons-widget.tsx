import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Save, 
  Copy, 
  Share, 
  Settings, 
  MoreHorizontal,
  Play,
  Pause,
  Square,
  RefreshCw,
  Filter,
  Search,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  FileText,
  Image,
  Video,
  LucideIcon
} from 'lucide-react';

interface ActionItem {
  id: string;
  label: string;
  icon?: LucideIcon | string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  tooltip?: string;
  confirmation?: {
    title: string;
    description: string;
  };
}

interface ActionGroup {
  label?: string;
  actions: ActionItem[];
}

interface ActionButtonsWidgetProps {
  // Single actions
  actions?: ActionItem[];
  
  // Grouped actions
  groups?: ActionGroup[];
  
  // Quick actions (prominent buttons)
  primaryActions?: ActionItem[];
  
  // Layout configuration
  layout?: 'horizontal' | 'vertical' | 'grid' | 'dropdown' | 'mixed';
  alignment?: 'left' | 'center' | 'right' | 'justify';
  spacing?: 'tight' | 'normal' | 'loose';
  
  // Display configuration
  title?: string;
  showLabels?: boolean;
  showIcons?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  
  // Responsive behavior
  mobileCollapse?: boolean;
  maxVisibleActions?: number;
  
  // Styling
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  'plus': Plus,
  'edit': Edit,
  'trash': Trash2,
  'download': Download,
  'upload': Upload,
  'save': Save,
  'copy': Copy,
  'share': Share,
  'settings': Settings,
  'more': MoreHorizontal,
  'play': Play,
  'pause': Pause,
  'stop': Square,
  'refresh': RefreshCw,
  'filter': Filter,
  'search': Search,
  'eye': Eye,
  'eye-off': EyeOff,
  'lock': Lock,
  'unlock': Unlock,
  'mail': Mail,
  'phone': Phone,
  'calendar': Calendar,
  'file': FileText,
  'image': Image,
  'video': Video,
};

export default function ActionButtonsWidget({
  actions = [],
  groups = [],
  primaryActions = [],
  layout = 'horizontal',
  alignment = 'left',
  spacing = 'normal',
  title,
  showLabels = true,
  showIcons = true,
  variant = 'default',
  mobileCollapse = true,
  maxVisibleActions = 5,
  className = ''
}: ActionButtonsWidgetProps) {
  
  const allActions = [...primaryActions, ...actions, ...groups.flatMap(g => g.actions)];
  const visibleActions = maxVisibleActions ? allActions.slice(0, maxVisibleActions) : allActions;
  const overflowActions = maxVisibleActions ? allActions.slice(maxVisibleActions) : [];

  const getSpacingClass = () => {
    switch (spacing) {
      case 'tight': return 'gap-1';
      case 'loose': return 'gap-4';
      default: return 'gap-2';
    }
  };

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'center': return 'justify-center';
      case 'right': return 'justify-end';
      case 'justify': return 'justify-between';
      default: return 'justify-start';
    }
  };

  const renderIcon = (iconProp: LucideIcon | string | undefined) => {
    if (!showIcons || !iconProp) return null;
    
    const IconComponent = typeof iconProp === 'string' ? iconMap[iconProp] : iconProp;
    if (!IconComponent) return null;
    
    return <IconComponent className="w-4 h-4" />;
  };

  const renderAction = (action: ActionItem, includeLabel = true) => {
    const IconComponent = renderIcon(action.icon);
    const hasIcon = !!IconComponent;
    const hasLabel = showLabels && includeLabel && action.label;
    
    return (
      <Button
        key={action.id}
        variant={action.variant || 'default'}
        size={action.size || (hasLabel ? 'default' : 'icon')}
        disabled={action.disabled}
        onClick={action.onClick}
        className={`${hasIcon && hasLabel ? 'gap-2' : ''} relative`}
      >
        {action.loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          IconComponent
        )}
        {hasLabel && <span>{action.label}</span>}
        {action.badge && (
          <Badge 
            variant={action.badge.variant || 'secondary'} 
            className="absolute -top-2 -right-2 h-5 px-1 text-xs"
          >
            {action.badge.text}
          </Badge>
        )}
      </Button>
    );
  };

  const renderDropdownActions = (actions: ActionItem[]) => {
    if (actions.length === 0) return null;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.variant === 'destructive' ? 'text-destructive' : ''}
            >
              {renderIcon(action.icon)}
              <span className="ml-2">{action.label}</span>
              {action.badge && (
                <Badge variant={action.badge.variant || 'secondary'} className="ml-auto">
                  {action.badge.text}
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderGroupedActions = () => {
    if (groups.length === 0) return null;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <MoreHorizontal className="w-4 h-4 mr-2" />
            More Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.label && (
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              )}
              {group.actions.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={action.variant === 'destructive' ? 'text-destructive' : ''}
                >
                  {renderIcon(action.icon)}
                  <span className="ml-2">{action.label}</span>
                  {action.badge && (
                    <Badge variant={action.badge.variant || 'secondary'} className="ml-auto">
                      {action.badge.text}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
              {groupIndex < groups.length - 1 && <DropdownMenuSeparator />}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderContent = () => {
    switch (layout) {
      case 'vertical':
        return (
          <div className={`flex flex-col ${getSpacingClass()}`}>
            {primaryActions.map(action => renderAction(action))}
            {actions.map(action => renderAction(action))}
            {renderGroupedActions()}
          </div>
        );

      case 'grid':
        return (
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${getSpacingClass()}`}>
            {primaryActions.map(action => renderAction(action))}
            {actions.map(action => renderAction(action))}
          </div>
        );

      case 'dropdown':
        return (
          <div className="flex gap-2">
            {primaryActions.slice(0, 2).map(action => renderAction(action))}
            {(actions.length > 0 || groups.length > 0 || primaryActions.length > 2) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {primaryActions.slice(2).map(action => (
                    <DropdownMenuItem key={action.id} onClick={action.onClick}>
                      {renderIcon(action.icon)}
                      <span className="ml-2">{action.label}</span>
                    </DropdownMenuItem>
                  ))}
                  {primaryActions.length > 2 && actions.length > 0 && <DropdownMenuSeparator />}
                  {actions.map(action => (
                    <DropdownMenuItem key={action.id} onClick={action.onClick}>
                      {renderIcon(action.icon)}
                      <span className="ml-2">{action.label}</span>
                    </DropdownMenuItem>
                  ))}
                  {groups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {(actions.length > 0 || groupIndex > 0) && <DropdownMenuSeparator />}
                      {group.label && <DropdownMenuLabel>{group.label}</DropdownMenuLabel>}
                      {group.actions.map(action => (
                        <DropdownMenuItem key={action.id} onClick={action.onClick}>
                          {renderIcon(action.icon)}
                          <span className="ml-2">{action.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );

      case 'mixed':
        return (
          <div className={`flex flex-wrap items-center ${getSpacingClass()} ${getAlignmentClass()}`}>
            {primaryActions.map(action => renderAction(action))}
            {visibleActions.map(action => renderAction(action))}
            {renderDropdownActions(overflowActions)}
            {renderGroupedActions()}
          </div>
        );

      default: // 'horizontal'
        return (
          <div className={`flex flex-wrap items-center ${getSpacingClass()} ${getAlignmentClass()}`}>
            {primaryActions.map(action => renderAction(action))}
            {actions.map(action => renderAction(action))}
            {renderGroupedActions()}
          </div>
        );
    }
  };

  const content = renderContent();

  if (variant === 'minimal') {
    return (
      <div className={className}>
        {content}
      </div>
    );
  }

  if (title) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${variant === 'compact' ? 'p-2' : 'p-4'} ${className}`}>
      {content}
    </div>
  );
}