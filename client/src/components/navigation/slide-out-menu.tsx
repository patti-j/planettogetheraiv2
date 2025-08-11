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

  const handleItemClick = (item: any) => {
    setLocation(item.href);
    addRecentPage(item.href, item.label, item.icon);
    onClose();
  };

  // Filter items based on search and permissions
  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.features.filter(item => {
      // Check permissions
      if (item.feature && item.action && !hasPermission(item.feature, item.action)) {
        return false;
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
              type="text"
              placeholder="Search menu..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Menu Content */}
        <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
          <div className="p-2 space-y-4">
            {/* Recent Pages Section */}
            {recentPages.length > 0 && !searchFilter && (
              <div>
                <h3 className="px-2 text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Recent</h3>
                <div className="space-y-0.5">
                  {recentPages.slice(0, 5).map((page) => (
                    <Button
                      key={page.path}
                      variant={location === page.path ? 'secondary' : 'ghost'}
                      className="w-full justify-start group h-8 px-2"
                      onClick={() => {
                        setLocation(page.path);
                        onClose();
                      }}
                    >
                      <span className="flex-1 text-left truncate text-sm">{page.label}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
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
            {filteredGroups.map((group) => (
              <div key={group.title}>
                {/* Category Heading */}
                <div className="px-2 mb-1 flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </h3>
                  <Badge variant="outline" className="h-4 px-1 text-[10px]">
                    {group.items.length}
                  </Badge>
                </div>

                {/* Menu Items */}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.href}
                        variant={location === item.href ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-left h-8 px-2"
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
                          <span className="truncate text-sm">{item.label}</span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}