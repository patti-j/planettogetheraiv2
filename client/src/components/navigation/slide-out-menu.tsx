import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { X, Search, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/useAuth';
import { useNavigation } from '@/contexts/NavigationContext';
import { navigationGroups } from '@/config/navigation-menu';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SlideOutMenu({ isOpen, onClose }: SlideOutMenuProps) {
  const [location, setLocation] = useLocation();
  const [searchFilter, setSearchFilter] = useState('');
  const { hasPermission } = usePermissions();
  const { recentPages, togglePinPage, addRecentPage } = useNavigation();
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Check if click is on the hamburger button
        const target = event.target as HTMLElement;
        if (!target.closest('button[aria-label*="menu"]')) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Auto-focus search input when menu opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Use a small delay to ensure the menu animation has started
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleItemClick = (item: any) => {
    setLocation(item.href);
    addRecentPage(item.href, item.label, item.icon);
    onClose();
  };

  // Filter items based on search and permissions
  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.features.filter(item => {
      // Skip permission check for common menu items that should always be visible
      // Including Smart KPI Tracking which should be accessible to all users
      const alwaysVisibleItems = ['SMART KPI Tracking', 'Max AI Assistant', 'Getting Started', 'Take a Guided Tour', 'Master Production Schedule'];
      
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
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity z-40",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Slide-out Menu */}
      <div
        ref={menuRef}
        className={cn(
          "fixed left-0 top-0 h-full bg-background border-r shadow-xl z-50",
          "transition-transform duration-300 ease-in-out",
          "w-80",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Navigation</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
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
        <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
          <div className="py-3">
            {/* Recent Pages Section */}
            {recentPages.length > 0 && !searchFilter && (
              <div className="px-3 pb-3 mb-3 border-b">
                <h3 className="text-[11px] font-medium text-muted-foreground/70 mb-2 uppercase tracking-wider">
                  Recent Pages
                </h3>
                <div className="space-y-1">
                  {recentPages.slice(0, 4).map((page) => (
                    <Button
                      key={page.path}
                      variant={location === page.path ? 'secondary' : 'ghost'}
                      className="w-full justify-start group h-7 px-2 text-sm font-normal"
                      onClick={() => {
                        setLocation(page.path);
                        onClose();
                      }}
                    >
                      <span className="flex-1 text-left truncate opacity-90">{page.label}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinPage(page.path);
                        }}
                      >
                        {page.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      </Button>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Groups */}
            {filteredGroups.map((group, index) => {
              // Define subtle background based on priority
              const priorityBg = group.priority === 'high' 
                ? 'bg-primary/[0.02]' 
                : group.priority === 'medium' 
                ? 'bg-muted/30'
                : '';
                
              return (
                <div 
                  key={group.title} 
                  className={cn(
                    "px-3 py-3",
                    index < filteredGroups.length - 1 && "border-b",
                    priorityBg
                  )}
                >
                  {/* Category Heading */}
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                      {group.title}
                    </h3>
                    {group.priority === 'high' && (
                      <span className="text-[10px] text-primary/60 font-medium">FEATURED</span>
                    )}
                  </div>

                  {/* Menu Items - Grid Layout for better visual organization */}
                  <div className="space-y-0.5">
                    {group.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;
                      
                      // Use predefined colors from navigation config or fall back to a color palette
                      const colors = [
                        'text-blue-500',
                        'text-green-500', 
                        'text-purple-500',
                        'text-orange-500',
                        'text-red-500',
                        'text-cyan-500',
                        'text-pink-500',
                        'text-yellow-500',
                        'text-indigo-500',
                        'text-emerald-500',
                        'text-violet-500',
                        'text-rose-500'
                      ];
                      const iconColor = colors[itemIndex % colors.length];
                      
                      return (
                        <Button
                          key={item.href}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-left h-8 px-2 font-normal transition-all duration-150",
                            isActive && "bg-accent text-accent-foreground",
                            !isActive && "hover:bg-accent/50 hover:text-foreground hover:translate-x-0.5"
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
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}