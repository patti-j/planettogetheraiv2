import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, Pin, PinOff, List, Folder, X, Home, Clock, Star, StarOff, GripVertical } from 'lucide-react';
import { getIconComponent } from './icon-registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/lib/utils';
import { usePermissions, useAuth } from '@/hooks/useAuth';
import { useNavigationAdapter } from '@/adapters/NavigationAdapter';
import { useSplitScreen } from '@/contexts/SplitScreenContext';
import { navigationGroups } from '@/config/navigation-menu';
import { useQuery } from '@tanstack/react-query';

interface NavigationMenuContentProps {
  isPinned: boolean;
  onTogglePin: () => void;
  onClose?: () => void;
  isOpen?: boolean;
}

// Sortable Favorite Item Component
interface SortableFavoriteItemProps {
  page: any;
  isActive: boolean;
  onNavigate: () => void;
  onToggleFavorite: () => void;
}

function SortableFavoriteItem({ page, isActive, onNavigate, onToggleFavorite }: SortableFavoriteItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.path });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = getIconComponent(page.icon || 'FileText');
  
  // Find the color from navigation config
  const getColorForPage = () => {
    for (const group of navigationGroups) {
      const feature = group.features.find((f: any) => f.href === page.path);
      if (feature) {
        const bgColor = feature.color;
        if (!bgColor) return 'text-blue-500';
        if (bgColor.includes('gradient')) return 'text-purple-500';
        return bgColor.replace('bg-', 'text-');
      }
    }
    return 'text-gray-500';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 group rounded-md transition-all",
        isDragging && "shadow-lg"
      )}
    >
      {/* Drag Handle - Always visible but subtle */}
      <div 
        {...attributes} 
        {...listeners}
        className={cn(
          "flex items-center justify-center cursor-move p-1 rounded hover:bg-accent/50 transition-all",
          "text-muted-foreground/40 hover:text-muted-foreground"
        )}
      >
        <GripVertical className="h-3 w-3" />
      </div>

      {/* Main Button */}
      <Button
        variant="ghost"
        className={cn(
          "flex-1 justify-start text-left h-9 px-2 font-normal transition-all duration-150",
          isActive && "bg-accent text-accent-foreground",
          !isActive && "hover:bg-accent/50 hover:text-foreground"
        )}
        onClick={onNavigate}
      >
        <div className="flex items-center gap-3 flex-1">
          <IconComponent className={cn(
            "h-4 w-4 flex-shrink-0",
            isActive ? "text-primary" : getColorForPage()
          )} />
          <span className={cn(
            "truncate text-sm",
            !isActive && "text-foreground/80"
          )}>
            {page.label}
          </span>
        </div>
      </Button>
      
      {/* Favorite Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
      >
        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
      </Button>
    </div>
  );
}

export function NavigationMenuContent({ isPinned, onTogglePin, onClose, isOpen }: NavigationMenuContentProps) {
  const [location, setLocation] = useLocation();
  const [searchFilter, setSearchFilter] = useState('');
  const [layoutMode, setLayoutMode] = useState<'list' | 'hierarchical'>('list');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { hasPermission } = usePermissions();
  
  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag end for reordering favorites
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = favoritePages.findIndex((p: any) => p.path === active.id);
    const newIndex = favoritePages.findIndex((p: any) => p.path === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(favoritePages, oldIndex, newIndex);
      reorderFavorites(newOrder);
    }
  };
  
  // Auto-focus search input when navigation menu opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Use a small delay to ensure the menu has fully opened and rendered
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          // Select existing text if any
          searchInputRef.current.select();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  const { splitMode, handleNavigation } = useSplitScreen();
  const { user } = useAuth();
  
  // Fetch user preferences to get maxRecentPages setting
  const { data: userPreferences } = useQuery<any>({
    queryKey: [`/api/user-preferences/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Safe navigation adapter access with fallback
  let addRecentPage = (path: string, label: string, icon?: string) => {};
  let recentPages: any[] = [];
  let togglePinPage = (path: string) => {};
  let clearRecentPages = () => {};
  let favoritePages: any[] = [];
  let toggleFavorite = (path: string, label: string, icon?: string) => {};
  let isFavorite = (path: string) => false;
  let clearFavorites = () => {};
  let moveFavoriteUp = (path: string) => {};
  let moveFavoriteDown = (path: string) => {};
  let reorderFavorites = (newOrder: any[]) => {};
  try {
    const navigation = useNavigationAdapter();
    addRecentPage = navigation.addRecentPage;
    recentPages = navigation.recentPages || [];
    togglePinPage = navigation.togglePinPage;
    clearRecentPages = navigation.clearRecentPages;
    favoritePages = navigation.favoritePages || [];
    toggleFavorite = navigation.toggleFavorite;
    isFavorite = navigation.isFavorite;
    clearFavorites = navigation.clearFavorites;
    moveFavoriteUp = navigation.moveFavoriteUp;
    moveFavoriteDown = navigation.moveFavoriteDown;
    reorderFavorites = navigation.reorderFavorites;
  } catch (error) {
    console.warn('NavigationAdapter not available, using fallback:', error);
  }

  // getIconComponent imported from icon-registry module

  // Get flat list of all navigation items for arrow navigation
  const getAllNavigationItems = () => {
    const items: any[] = [];
    navigationGroups.forEach(group => {
      group.features.forEach(item => {
        // Check permissions
        const alwaysVisibleItems = ['SMART KPI Tracking', 'Max AI Assistant', 'Getting Started', 'Take a Guided Tour', 'Master Production Schedule'];
        if (!alwaysVisibleItems.includes(item.label)) {
          if (item.feature && item.action && !hasPermission(item.feature, item.action)) {
            return;
          }
        }
        items.push(item);
      });
    });
    return items;
  };

  const allItems = getAllNavigationItems();
  const currentIndex = allItems.findIndex(item => item.href === location);

  // Show all recent pages - they provide quick access even if they're in main navigation
  const filteredRecentPages = recentPages;

  const handleItemClick = (item: any) => {
    // Handle external links (e.g., HTML files)
    if (item.isExternal || item.href.endsWith('.html')) {
      window.open(item.href, '_blank');
      if (!isPinned && onClose) onClose();
      return;
    }
    
    // Extract icon name from React component
    const iconName = item.icon?.displayName || item.icon?.name || 'FileText';
    
    // Use the split screen context's navigation handler - this will show the dialog if needed
    handleNavigation(item.href, item.label);
    addRecentPage(item.href, item.label, iconName);
    if (!isPinned && onClose) onClose();
  };

  const toggleGroup = (groupTitle: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupTitle)) {
      newExpanded.delete(groupTitle);
    } else {
      newExpanded.add(groupTitle);
    }
    setExpandedGroups(newExpanded);
  };

  // Filter items based on search and permissions
  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.features.filter(item => {
      // Skip permission check for common menu items that should always be visible
      const alwaysVisibleItems = ['SMART KPI Tracking', 'Max AI Assistant', 'Getting Started', 'Take a Guided Tour', 'Master Production Schedule', 'Production Scheduler'];
      
      // Check permissions only if not in always visible list
      if (!alwaysVisibleItems.includes(item.label)) {
        if (item.feature && item.action && !hasPermission(item.feature, item.action)) {
          return false;
        }
      }
      
      // Check search filter
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        return item.label.toLowerCase().includes(searchLower);
      }
      return true;
    })
  })).filter(group => group.items.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Navigation</h2>
          <div className="flex items-center gap-1">
            {/* Layout Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLayoutMode(layoutMode === 'list' ? 'hierarchical' : 'list')}
              className="h-8 w-8"
              title={layoutMode === 'list' ? 'Switch to hierarchical view' : 'Switch to list view'}
            >
              {layoutMode === 'list' ? <Folder className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
            
            {/* Pin Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePin}
              className={cn("h-8 w-8", isPinned && "bg-accent text-accent-foreground")}
              title={isPinned ? 'Unpin menu' : 'Pin menu open'}
            >
              {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            
            {/* Close button - only show when not pinned */}
            {!isPinned && onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
                title="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Home Button */}
        <div className="mb-3">
          <Button
            variant={location === '/home' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              handleNavigation('/home', 'Home');
              if (!isPinned && onClose) onClose();
            }}
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>
        

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search menu..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchFilter && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchFilter('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Menu Content */}
      <ScrollArea className="flex-1 overflow-y-auto navigation-menu-scroll">
        <div className="py-3 pb-10" style={{ 
          touchAction: 'pan-y', 
          WebkitOverflowScrolling: 'touch', 
          overscrollBehavior: 'contain' 
        }}>
          {layoutMode === 'list' ? (
            // List Layout - Show items grouped by category with headers
            <div className="px-3">
              {/* Favorites Group - Always show at top if there are favorite pages */}
              {favoritePages.length > 0 && (
                <div className="mb-4 border-b border-border/20 pb-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-2 py-1 mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium text-foreground/70">
                        Favorites
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {favoritePages.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFavorites}
                        className="h-5 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Favorite Pages Items with Drag and Drop */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={favoritePages.map(p => p.path)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-0.5">
                        {favoritePages.map((page, pageIndex) => (
                          <SortableFavoriteItem
                            key={page.path}
                            page={page}
                            isActive={location === page.path}
                            onNavigate={() => {
                              handleNavigation(page.path, page.label);
                              if (!isPinned && onClose) onClose();
                            }}
                            onToggleFavorite={() => {
                              toggleFavorite(page.path, page.label, page.icon);
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* Recents Group - Always show at top if there are recent pages */}
              {filteredRecentPages.length > 0 && (
                <div className="mb-4 border-b border-border/20 pb-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-2 py-1 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground/70">
                        Recents
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {filteredRecentPages.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentPages}
                        className="h-5 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Recent Pages Items */}
                  <div className="space-y-0.5">
                    {filteredRecentPages.slice(0, userPreferences?.dashboardLayout?.maxRecentPages || 5).map((page, pageIndex) => {
                      const IconComponent = getIconComponent(page.icon || 'FileText');
                      const isActive = location === page.path;
                      
                      // Find the color from navigation config
                      const getColorForPage = () => {
                        for (const group of navigationGroups) {
                          const feature = group.features.find((f: any) => f.href === page.path);
                          if (feature) {
                            // Convert bg-color to text-color
                            const bgColor = feature.color;
                            if (!bgColor) return 'text-blue-500';
                            if (bgColor.includes('gradient')) return 'text-purple-500';
                            return bgColor.replace('bg-', 'text-');
                          }
                        }
                        return 'text-gray-500';
                      };

                      return (
                        <Button
                          key={`${page.path}-${pageIndex}`}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-left h-9 px-3 font-normal transition-all duration-150 group",
                            isActive && "bg-accent text-accent-foreground",
                            !isActive && "hover:bg-accent/50 hover:text-foreground"
                          )}
                          onClick={() => {
                            handleNavigation(page.path, page.label);
                            if (!isPinned && onClose) onClose();
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <IconComponent className={cn(
                              "h-4 w-4 flex-shrink-0",
                              isActive ? "text-primary" : getColorForPage()
                            )} />
                            <span className={cn(
                              "truncate text-sm",
                              !isActive && "text-foreground/80"
                            )}>
                              {page.label}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-4 w-4 p-0 transition-opacity",
                              page.isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinPage(page.path);
                            }}
                          >
                            {page.isPinned ? (
                              <PinOff className="h-2.5 w-2.5" />
                            ) : (
                              <Pin className="h-2.5 w-2.5" />
                            )}
                          </Button>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredGroups.map((group, groupIndex) => {
                const priorityBg = group.priority === 'high' 
                  ? 'bg-primary/[0.02]' 
                  : group.priority === 'medium' 
                  ? 'bg-muted/30'
                  : '';
                  
                return (
                  <div 
                    key={group.title}
                    className={cn(
                      "mb-4",
                      groupIndex < filteredGroups.length - 1 && "border-b border-border/20 pb-4",
                      priorityBg && "rounded-lg p-2 -mx-2"
                    )}
                  >
                    {/* Category Header - Non-clickable in list view */}
                    <div className="flex items-center gap-2 px-2 py-1 mb-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground/70">
                        {group.title}
                      </span>
                      {group.priority === 'high' && (
                        <span className="text-[10px] text-primary/60 font-medium px-1.5 py-0.5 bg-primary/10 rounded">
                          FEATURED
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {group.items.length}
                      </span>
                    </div>

                    {/* Category Items */}
                    <div className="space-y-0.5">
                      {group.items.map((item, itemIndex) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        
                        const colors = [
                          'text-blue-500', 'text-green-500', 'text-purple-500',
                          'text-orange-500', 'text-red-500', 'text-cyan-500',
                          'text-pink-500', 'text-yellow-500', 'text-indigo-500',
                          'text-emerald-500', 'text-violet-500', 'text-rose-500'
                        ];
                        const iconColor = colors[itemIndex % colors.length];
                        
                        return (
                          <Button
                            key={item.href}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left h-9 px-3 font-normal transition-all duration-150 group",
                              isActive && "bg-accent text-accent-foreground",
                              !isActive && "hover:bg-accent/50 hover:text-foreground"
                            )}
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {Icon && (
                                <Icon className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  isActive ? "text-primary" : iconColor
                                )} />
                              )}
                              <span className={cn(
                                "truncate text-sm",
                                !isActive && "text-foreground/80"
                              )}>
                                {item.label}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-4 w-4 p-0 transition-opacity",
                                isFavorite(item.href) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                const iconName = Icon?.displayName || Icon?.name || 'FileText';
                                toggleFavorite(item.href, item.label, iconName);
                              }}
                            >
                              {isFavorite(item.href) ? (
                                <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                              ) : (
                                <StarOff className="h-2.5 w-2.5 text-muted-foreground" />
                              )}
                            </Button>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Hierarchical Layout - Show collapsible categories
            <>
              {/* Favorites as Collapsible Category - Only show when there are favorite pages */}
              {favoritePages.length > 0 && (
                <div className="px-3 py-2 border-b border-border/40">
                  {/* Favorites Header - Clickable to expand/collapse */}
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-9 px-2 font-medium hover:bg-accent/50"
                    onClick={() => toggleGroup('Favorites')}
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">
                        Favorites
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {favoritePages.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFavorites();
                        }}
                        className="h-5 w-5 p-0 ml-1 text-xs hover:bg-muted-foreground/20"
                        title="Clear favorites"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </Button>

                  {/* Favorite Pages Items - Only shown when expanded */}
                  {expandedGroups.has('Favorites') && (
                    <div className="mt-1 ml-3 space-y-0.5">
                      {favoritePages.map((page, pageIndex) => {
                        const IconComponent = getIconComponent(page.icon || 'FileText');
                        const isActive = location === page.path;
                        
                        // Find the color from navigation config
                        const getColorForPage = () => {
                          for (const group of navigationGroups) {
                            const feature = group.features.find((f: any) => f.href === page.path);
                            if (feature) {
                              // Convert bg-color to text-color
                              const bgColor = feature.color;
                              if (!bgColor) return 'text-blue-500';
                              if (bgColor.includes('gradient')) return 'text-purple-500';
                              return bgColor.replace('bg-', 'text-');
                            }
                          }
                          return 'text-gray-500';
                        };
                        
                        return (
                          <Button
                            key={`fav-hier-${page.path}-${pageIndex}`}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left h-8 px-2 font-normal transition-all duration-150 ml-3 group",
                              isActive && "bg-accent text-accent-foreground",
                              !isActive && "hover:bg-accent/50 hover:text-foreground"
                            )}
                            onClick={() => {
                              handleNavigation(page.path, page.label);
                              if (!isPinned && onClose) onClose();
                            }}
                          >
                            <div className="flex items-center gap-2.5 flex-1">
                              <IconComponent className={cn(
                                "h-3.5 w-3.5 flex-shrink-0",
                                isActive ? "text-primary" : getColorForPage()
                              )} />
                              <span className={cn(
                                "truncate text-sm",
                                !isActive && "text-foreground/80"
                              )}>
                                {page.label}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-4 w-4 p-0 transition-opacity opacity-100"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(page.path, page.label, page.icon);
                              }}
                            >
                              <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                            </Button>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Recents as Collapsible Category - Only show when there are recent pages */}
              {filteredRecentPages.length > 0 && (
                <div className="px-3 py-2 border-b border-border/40">
                  {/* Recents Header - Clickable to expand/collapse */}
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-9 px-2 font-medium hover:bg-accent/50"
                    onClick={() => toggleGroup('Recents')}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Recents
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {filteredRecentPages.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearRecentPages();
                        }}
                        className="h-5 w-5 p-0 ml-1 text-xs hover:bg-muted-foreground/20"
                        title="Clear recent pages"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </Button>

                  {/* Recent Pages Items - Only shown when expanded */}
                  {expandedGroups.has('Recents') && (
                    <div className="mt-1 ml-3 space-y-0.5">
                      {filteredRecentPages.map((page, pageIndex) => {
                        const IconComponent = getIconComponent(page.icon || 'FileText');
                        const isActive = location === page.path;
                        
                        // Find the color from navigation config
                        const getColorForPage = () => {
                          for (const group of navigationGroups) {
                            const feature = group.features.find((f: any) => f.href === page.path);
                            if (feature) {
                              // Convert bg-color to text-color
                              const bgColor = feature.color;
                              if (!bgColor) return 'text-blue-500';
                              if (bgColor.includes('gradient')) return 'text-purple-500';
                              return bgColor.replace('bg-', 'text-');
                            }
                          }
                          return 'text-gray-500';
                        };
                        
                        return (
                          <Button
                            key={`${page.path}-${pageIndex}`}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-left h-8 px-2 font-normal transition-all duration-150 ml-3 group",
                              isActive && "bg-accent text-accent-foreground",
                              !isActive && "hover:bg-accent/50 hover:text-foreground"
                            )}
                            onClick={() => {
                              handleNavigation(page.path, page.label);
                              addRecentPage(page.path, page.label, page.icon);
                              if (!isPinned && onClose) onClose();
                            }}
                          >
                            <div className="flex items-center gap-2.5 flex-1">
                              <IconComponent className={cn(
                                "h-3.5 w-3.5 flex-shrink-0",
                                isActive ? "text-primary" : getColorForPage()
                              )} />
                              <span className={cn(
                                "truncate text-sm",
                                !isActive && "text-foreground/80"
                              )}>
                                {page.label}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-4 w-4 p-0 transition-opacity",
                                page.isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinPage(page.path);
                              }}
                            >
                              {page.isPinned ? (
                                <PinOff className="h-2.5 w-2.5" />
                              ) : (
                                <Pin className="h-2.5 w-2.5" />
                              )}
                            </Button>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {filteredGroups.map((group, index) => {
                const isExpanded = expandedGroups.has(group.title);
                const priorityBg = group.priority === 'high' 
                  ? 'bg-primary/[0.02]' 
                  : group.priority === 'medium' 
                  ? 'bg-muted/30'
                  : '';
                  
                return (
                  <div 
                    key={group.title} 
                    className={cn(
                      "px-3 py-2",
                      index < filteredGroups.length - 1 && "border-b border-border/40",
                      priorityBg
                    )}
                  >
                    {/* Category Header - Clickable to expand/collapse */}
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-9 px-2 font-medium hover:bg-accent/50"
                      onClick={() => toggleGroup(group.title)}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {group.title}
                        </span>
                        {group.priority === 'high' && (
                          <span className="text-[10px] text-primary/60 font-medium px-1.5 py-0.5 bg-primary/10 rounded">
                            FEATURED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {group.items.length}
                        </span>
                      </div>
                    </Button>

                    {/* Category Items - Only shown when expanded */}
                    {isExpanded && (
                      <div className="mt-1 ml-3 space-y-0.5">
                        {group.items.map((item, itemIndex) => {
                          const Icon = item.icon;
                          const isActive = location === item.href;
                          
                          const colors = [
                            'text-blue-500', 'text-green-500', 'text-purple-500',
                            'text-orange-500', 'text-red-500', 'text-cyan-500',
                            'text-pink-500', 'text-yellow-500', 'text-indigo-500',
                            'text-emerald-500', 'text-violet-500', 'text-rose-500'
                          ];
                          const iconColor = colors[itemIndex % colors.length];
                          
                          return (
                            <Button
                              key={item.href}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start text-left h-8 px-2 font-normal transition-all duration-150 ml-3",
                                isActive && "bg-accent text-accent-foreground",
                                !isActive && "hover:bg-accent/50 hover:text-foreground"
                              )}
                              onClick={() => handleItemClick(item)}
                            >
                              <div className="flex items-center gap-2.5 flex-1">
                                {Icon && (
                                  <Icon className={cn(
                                    "h-3.5 w-3.5 flex-shrink-0",
                                    isActive ? "text-primary" : iconColor
                                  )} />
                                )}
                                <span className={cn(
                                  "truncate text-sm",
                                  !isActive && "text-foreground/80"
                                )}>
                                  {item.label}
                                </span>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}