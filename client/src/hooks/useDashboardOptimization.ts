import { useState, useMemo, useEffect } from 'react';

interface DashboardCard {
  id: string;
  priority: number; // 1 = highest priority, higher numbers = lower priority
  content: React.ReactNode;
}

interface DashboardOptimizationConfig {
  maxVisibleCards?: number;
  maxVisibleCardsMobile?: number;
  maxVisibleCardsTablet?: number;
  maxVisibleCardsDesktop?: number;
  showMoreText?: string;
  showLessText?: string;
}

export function useDashboardOptimization(
  cards: DashboardCard[],
  config: DashboardOptimizationConfig = {}
) {
  const [showAll, setShowAll] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  const {
    maxVisibleCards = 3,
    maxVisibleCardsMobile = 2,
    maxVisibleCardsTablet = 3,
    maxVisibleCardsDesktop = 4,
    showMoreText = "Show More",
    showLessText = "Show Less"
  } = config;

  // Sort cards by priority (lower number = higher priority)
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => a.priority - b.priority);
  }, [cards]);

  // Handle responsive behavior with resize listener
  useEffect(() => {
    const updateScreenSize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 640) {
          setScreenSize('mobile');
        } else if (width < 1024) {
          setScreenSize('tablet');
        } else {
          setScreenSize('desktop');
        }
      }
    };

    // Set initial screen size
    updateScreenSize();

    // Add resize listener
    window.addEventListener('resize', updateScreenSize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, []);

  // Determine how many cards to show based on current screen size
  const getMaxCards = () => {
    switch (screenSize) {
      case 'mobile':
        return maxVisibleCardsMobile;
      case 'tablet':
        return maxVisibleCardsTablet;
      case 'desktop':
        return maxVisibleCardsDesktop;
      default:
        return maxVisibleCards;
    }
  };

  const maxCards = getMaxCards();
  const hasOverflow = sortedCards.length > maxCards;
  
  const visibleCards = useMemo(() => {
    if (showAll || !hasOverflow) {
      return sortedCards;
    }
    return sortedCards.slice(0, maxCards);
  }, [sortedCards, showAll, hasOverflow, maxCards]);

  const hiddenCount = sortedCards.length - maxCards;

  const toggleShowAll = () => setShowAll(!showAll);

  return {
    visibleCards,
    hiddenCount,
    hasOverflow,
    showAll,
    toggleShowAll,
    showMoreText: `${showMoreText} (${hiddenCount})`,
    showLessText
  };
}