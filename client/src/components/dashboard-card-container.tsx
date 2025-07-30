import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useDashboardOptimization } from '@/hooks/useDashboardOptimization';

interface DashboardCard {
  id: string;
  priority: number;
  content: React.ReactNode;
}

interface DashboardCardContainerProps {
  cards: DashboardCard[];
  className?: string;
  gridClassName?: string;
  maxVisibleCards?: number;
  maxVisibleCardsMobile?: number;
  maxVisibleCardsTablet?: number;
  maxVisibleCardsDesktop?: number;
  showMoreText?: string;
  showLessText?: string;
}

export function DashboardCardContainer({
  cards,
  className = "",
  gridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
  ...config
}: DashboardCardContainerProps) {
  const {
    visibleCards,
    hasOverflow,
    showAll,
    toggleShowAll,
    showMoreText,
    showLessText
  } = useDashboardOptimization(cards, config);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className={gridClassName}>
        {visibleCards.map((card) => (
          <div key={card.id}>
            {card.content}
          </div>
        ))}
      </div>
      
      {hasOverflow && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleShowAll}
            className="flex items-center gap-2 text-sm"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4" />
                {showLessText}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {showMoreText}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}