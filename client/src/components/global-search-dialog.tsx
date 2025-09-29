import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, ChevronRight, Clock, Star } from "lucide-react";
import { navigationGroups } from "@/config/navigation-menu";
import { useNavigation } from "@/contexts/NavigationContext";
import { usePermissions, useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [, setLocation] = useLocation();
  const { recentPages, addRecentPage } = useNavigation();
  const { hasPermission, user } = usePermissions();
  
  // Fetch user preferences to get maxRecentPages setting
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/user-preferences/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
    enabled: !!user?.id
  });

  // Get all searchable items from navigation
  const getAllSearchableItems = () => {
    const items: any[] = [];
    
    navigationGroups.forEach(group => {
      group.features.forEach(feature => {
        // Skip special actions
        if (feature.href === "#max" || feature.href === "#tour") return;
        
        // Check permissions
        if (feature.feature && !hasPermission(feature.feature, feature.action)) return;
        
        items.push({
          ...feature,
          groupTitle: group.title,
          groupColor: group.color
        });
      });
    });
    
    return items;
  };

  // Search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const allItems = getAllSearchableItems();
    
    const results = allItems.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.groupTitle.toLowerCase().includes(query)
    );
    
    // Sort by relevance (exact matches first)
    results.sort((a, b) => {
      const aExact = a.label.toLowerCase() === query;
      const bExact = b.label.toLowerCase() === query;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });
    
    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  }, [searchQuery]);

  // Handle item selection
  const handleItemClick = (item: any) => {
    addRecentPage(item.href, item.label, item.icon?.name || 'FileText');
    setLocation(item.href);
    onOpenChange(false);
    setSearchQuery("");
  };

  // Get recent items for quick access
  const getRecentItems = () => {
    const maxRecentPages = userPreferences?.dashboardLayout?.maxRecentPages || 5;
    return recentPages.slice(0, maxRecentPages).map(page => ({
      ...page,
      isRecent: true
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-base">Search</DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for features, pages, or actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Results Area */}
        <ScrollArea className="h-[400px]">
          <div className="px-2 py-2">
            {/* Show search results */}
            {searchQuery && searchResults.length > 0 && (
              <div>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Search Results
                </div>
                {searchResults.map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start px-2 py-2 h-auto"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {item.icon && (
                        <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.groupTitle}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                ))}
              </div>
            )}
            
            {/* Show "no results" message */}
            {searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try searching with different keywords</p>
              </div>
            )}
            
            {/* Show recent pages when no search */}
            {!searchQuery && (
              <div>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Recent Pages
                </div>
                {getRecentItems().length > 0 ? (
                  getRecentItems().map((page, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start px-2 py-2 h-auto"
                      onClick={() => {
                        setLocation(page.path);
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">{page.label}</div>
                          <div className="text-xs text-muted-foreground">Recently visited</div>
                        </div>
                        {page.isPinned && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No recent pages
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}