import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowRight, FileText, Package, DollarSign, Sparkles, Clock, TrendingUp, Cpu, Users, Building, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLocation, useRoute } from 'wouter';

// Define searchable content types
type SearchResult = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'product' | 'pricing' | 'features' | 'solutions' | 'resources' | 'company';
  url: string;
  icon?: React.ElementType;
  tags?: string[];
  relevance?: number;
};

// Comprehensive search index for all public content
const searchIndex: SearchResult[] = [
  // Product Pages
  {
    id: 'home',
    title: 'PlanetTogether Overview',
    description: 'AI-first Factory Optimization Platform for manufacturing',
    content: 'Advanced Production Scheduling APS system manufacturing execution MES real-time optimization visual Gantt charts supply chain visibility',
    category: 'product',
    url: '/home',
    icon: Building,
    tags: ['overview', 'platform', 'manufacturing', 'APS', 'MES']
  },
  {
    id: 'scheduling',
    title: 'Production Scheduling',
    description: 'Visual Gantt scheduling with drag-and-drop and AI optimization',
    content: 'Bryntum Scheduler Pro drag drop constraints ASAP ALAP Critical Path Resource Leveling Theory of Constraints DBR scheduling algorithms',
    category: 'features',
    url: '/production-scheduler',
    icon: Clock,
    tags: ['scheduling', 'gantt', 'optimization', 'algorithms']
  },
  {
    id: 'ai-assistant',
    title: 'Max AI Assistant',
    description: 'Intelligent production assistant powered by GPT-4o',
    content: 'OpenAI GPT-4o voice chat real-time production intelligence schedule analysis bottleneck detection optimization recommendations',
    category: 'features',
    url: '/ai-consultant',
    icon: Sparkles,
    tags: ['AI', 'assistant', 'GPT-4', 'voice', 'intelligence']
  },
  {
    id: 'optimization-studio',
    title: 'Optimization Studio',
    description: 'Visual algorithm builder with 6+ scheduling algorithms',
    content: 'algorithm registry ASAP ALAP Critical Path Resource Leveling bottleneck optimizer DBR scheduling SSE progress tracking',
    category: 'features',
    url: '/optimization-studio',
    icon: Cpu,
    tags: ['optimization', 'algorithms', 'scheduling', 'automation']
  },
  
  // Pricing
  {
    id: 'pricing-plans',
    title: 'Pricing Plans',
    description: 'Flexible pricing options for manufacturers of all sizes',
    content: 'starter professional enterprise custom pricing per user per month annual discount free trial pilot program',
    category: 'pricing',
    url: '/pricing',
    icon: DollarSign,
    tags: ['pricing', 'plans', 'cost', 'subscription']
  },
  {
    id: 'pricing-enterprise',
    title: 'Enterprise Pricing',
    description: 'Custom solutions for large manufacturing operations',
    content: 'unlimited users multi-plant support dedicated account manager custom integrations SLA priority support training',
    category: 'pricing',
    url: '/pricing#enterprise',
    icon: Building,
    tags: ['enterprise', 'custom', 'large-scale']
  },
  
  // Features
  {
    id: 'product-wheels',
    title: 'Product Wheels',
    description: 'Cyclic production scheduling with visual donut charts',
    content: 'cyclic scheduling brewery production wheels segment planning changeover optimization visual donut charts sequence management',
    category: 'features',
    url: '/product-wheels',
    icon: Package,
    tags: ['product wheels', 'cyclic', 'scheduling']
  },
  {
    id: 'shift-management',
    title: 'Shift Management',
    description: 'Templates, assignments, overtime and downtime tracking',
    content: 'shift templates resource assignments overtime tracking unplanned downtime labor planning workforce scheduling',
    category: 'features',
    url: '/shift-management',
    icon: Users,
    tags: ['shifts', 'labor', 'workforce', 'scheduling']
  },
  {
    id: 'demand-forecasting',
    title: 'Demand Forecasting',
    description: 'AI-powered demand prediction and time-series analysis',
    content: 'time-series forecasting machine learning SQL Server integration Recharts visualization predictive analytics demand planning',
    category: 'features',
    url: '/demand-forecasting',
    icon: TrendingUp,
    tags: ['forecasting', 'AI', 'analytics', 'demand']
  },
  {
    id: 'global-control-tower',
    title: 'Global Control Tower',
    description: 'Real-time KPI monitoring and plant performance tracking',
    content: 'KPI management weighted performance autonomous optimization real-time monitoring plant visibility dashboard analytics',
    category: 'features',
    url: '/global-control-tower',
    icon: Building,
    tags: ['KPI', 'monitoring', 'control tower', 'performance']
  },
  
  // Solutions
  {
    id: 'pharmaceutical',
    title: 'Pharmaceutical Manufacturing',
    description: 'GMP-compliant scheduling for pharma production',
    content: 'FDA compliance batch tracking validation quality control pharmaceutical GMP regulated manufacturing',
    category: 'solutions',
    url: '/industry-templates#pharmaceutical',
    icon: Package,
    tags: ['pharmaceutical', 'FDA', 'GMP', 'compliance']
  },
  {
    id: 'chemical',
    title: 'Chemical Processing',
    description: 'Optimize complex chemical production workflows',
    content: 'chemical processing batch continuous production safety compliance hazardous materials tank scheduling',
    category: 'solutions',
    url: '/industry-templates#chemical',
    icon: Package,
    tags: ['chemical', 'processing', 'safety']
  },
  {
    id: 'food-production',
    title: 'Food Production',
    description: 'Food safety, HACCP compliance, and freshness optimization',
    content: 'food production food safety HACCP allergen tracking shelf life batch traceability sanitation',
    category: 'solutions',
    url: '/industry-templates#food-production',
    icon: Package,
    tags: ['food', 'HACCP', 'freshness', 'safety']
  },
  {
    id: 'beverage-production',
    title: 'Beverage Production',
    description: 'Brewery, dairy, and beverage production optimization',
    content: 'brewery production beverage fermentation packaging bottling canning tank scheduling dairy',
    category: 'solutions',
    url: '/industry-templates#beverage-production',
    icon: Package,
    tags: ['beverage', 'brewery', 'fermentation', 'packaging']
  },
  
  // Resources
  {
    id: 'roadmap',
    title: 'Product Roadmap',
    description: 'See what features are coming next',
    content: 'roadmap future features development timeline upcoming releases version 14 enterprise features',
    category: 'resources',
    url: '/product-development',
    icon: FileText,
    tags: ['roadmap', 'future', 'development']
  },
  {
    id: 'whats-coming',
    title: "What's Coming in v14",
    description: 'Preview of next major release features',
    content: 'version 14 new features multi-plant federation advanced MRP DDMRP supply chain integration mobile apps',
    category: 'resources',
    url: '/whats-coming-v14',
    icon: Sparkles,
    tags: ['v14', 'preview', 'upcoming']
  },
  {
    id: 'api-docs',
    title: 'API Documentation',
    description: 'RESTful API for system integration',
    content: 'REST API integration documentation endpoints authentication webhooks SDK developer tools',
    category: 'resources',
    url: '/api-documentation',
    icon: FileText,
    tags: ['API', 'documentation', 'integration', 'developers']
  },
  
  // Company
  {
    id: 'about',
    title: 'About PlanetTogether',
    description: 'Mission to revolutionize manufacturing with AI',
    content: 'about company mission vision team manufacturing excellence AI innovation industry leadership',
    category: 'company',
    url: '/about',
    icon: Building,
    tags: ['about', 'company', 'mission']
  },
  {
    id: 'contact',
    title: 'Contact Sales',
    description: 'Get in touch with our sales team',
    content: 'contact sales demo request consultation pricing quote enterprise support',
    category: 'company',
    url: '/contact',
    icon: Users,
    tags: ['contact', 'sales', 'demo']
  }
];

export function PublicSiteSearch({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('public-site-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Keyboard shortcut to open search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when dialog opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Perform search
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    searchIndex.forEach((item) => {
      let relevance = 0;
      
      // Check title match (highest weight)
      if (item.title.toLowerCase().includes(query)) {
        relevance += 10;
      }
      
      // Check description match
      if (item.description.toLowerCase().includes(query)) {
        relevance += 5;
      }
      
      // Check content match
      if (item.content.toLowerCase().includes(query)) {
        relevance += 3;
      }
      
      // Check tags match
      if (item.tags?.some(tag => tag.toLowerCase().includes(query))) {
        relevance += 7;
      }
      
      if (relevance > 0) {
        searchResults.push({ ...item, relevance });
      }
    });

    // Sort by relevance
    searchResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    
    setResults(searchResults.slice(0, 10)); // Limit to top 10 results
    setSelectedIndex(0);
  }, []);

  // Handle search input change
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 150); // Debounce search

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const updatedRecent = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('public-site-recent-searches', JSON.stringify(updatedRecent));
    
    // Navigate to the page
    setLocation(result.url);
    setIsOpen(false);
    setQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleResultClick(results[selectedIndex]);
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors = {
      product: 'bg-blue-100 text-blue-800',
      pricing: 'bg-green-100 text-green-800',
      features: 'bg-purple-100 text-purple-800',
      solutions: 'bg-orange-100 text-orange-800',
      resources: 'bg-pink-100 text-pink-800',
      company: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground",
          "border border-input rounded-lg hover:bg-accent transition-colors",
          "min-w-[200px] justify-between",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Search...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search documentation, features, pricing..."
              className="flex-1 border-0 px-0 focus-visible:ring-0"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-accent rounded"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <ScrollArea className="max-h-[400px]">
            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">RECENT</p>
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(search)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
                  >
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {search}
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {query && results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => {
                  const Icon = result.icon || FileText;
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        "flex items-start gap-3 w-full px-4 py-3 transition-colors text-left",
                        selectedIndex === index ? "bg-accent" : "hover:bg-accent/50"
                      )}
                    >
                      <Icon className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{result.title}</span>
                          <Badge variant="secondary" className={cn("text-xs", getCategoryColor(result.category))}>
                            {result.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {query && results.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No results found for "<strong>{query}</strong>"
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Try searching for features, pricing, or solutions
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-muted/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 bg-background border rounded">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 bg-background border rounded">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 bg-background border rounded">Esc</kbd>
                  Close
                </span>
              </div>
              {results.length > 0 && (
                <span>{results.length} results</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}