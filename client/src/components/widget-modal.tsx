import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OperationSequencerWidget from '@/components/widgets/operation-sequencer-widget';
// import ScheduleOptimizerWidget from '@/components/widgets/schedule-optimizer-widget';

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetType: string;
  title: string;
}

const WidgetModal: React.FC<WidgetModalProps> = ({ isOpen, onClose, widgetType, title }) => {
  const renderWidget = () => {
    switch (widgetType) {
      case 'operation-sequencer':
        return <OperationSequencerWidget />;
      case 'schedule-optimizer':
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Schedule Optimizer</h3>
            <p className="text-gray-600">Optimize production schedules for maximum efficiency.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Current Efficiency</h4>
                <p className="text-2xl font-bold text-green-600">94%</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Time Savings</h4>
                <p className="text-2xl font-bold text-blue-600">2.5hrs</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6 text-center text-gray-500">
            Widget type "{widgetType}" not found
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-6">
          {renderWidget()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetModal;