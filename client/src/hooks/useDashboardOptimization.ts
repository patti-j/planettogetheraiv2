import { useState, useMemo } from 'react';

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

  // Determine how many cards to show based on screen size
  const getMaxCards = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return maxVisibleCardsMobile; // mobile
      if (width < 1024) return maxVisibleCardsTablet; // tablet
      return maxVisibleCardsDesktop; // desktop
    }
    return maxVisibleCards;
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