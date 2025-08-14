import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import OperationSequencerWidget from '@/components/widgets/operation-sequencer-widget';
import ScheduleOptimizationWidget from '@/components/schedule-optimization-widget';
import CustomKPIWidget from '@/components/widgets/custom-kpi-widget';

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetType: string;
  widgetTitle: string;
}

const WidgetModal: React.FC<WidgetModalProps> = ({
  isOpen,
  onClose,
  widgetType,
  widgetTitle,
}) => {
  const renderWidget = () => {
    switch (widgetType) {
      case 'operation-sequencer':
        return (
          <OperationSequencerWidget
            title="Operation Sequencer"
            isDesktop={true}
            configuration={{ isDesktop: true, view: 'list' }}
          />
        );
      case 'schedule-optimizer':
        return (
          <ScheduleOptimizationWidget
            title="Schedule Optimizer"
            showOptimizer={true}
            configuration={{ showOptimizer: true }}
          />
        );
      case 'custom-kpi':
        return (
          <CustomKPIWidget
            title="Custom KPI Tracker"
            configuration={{ 
              view: 'standard', 
              showTrends: true, 
              showTargets: true, 
              maxKPIs: 6,
              kpis: ['oee', 'yield', 'cost-per-unit'] 
            }}
          />
        );
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Widget type "{widgetType}" not found.
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] max-h-[800px] p-0">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-semibold">
            {widgetTitle}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {renderWidget()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetModal;