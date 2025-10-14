import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface WorkingHours {
  startTime: string;
  endTime: string;
  days: string[];
}

interface MaintenancePeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  recurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  resourceId?: string;
}

export default function CalendarManagement() {
  const { toast } = useToast();
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    startTime: '07:00',
    endTime: '17:00',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });
  
  const [maintenancePeriods, setMaintenancePeriods] = useState<MaintenancePeriod[]>([]);
  const [newMaintenance, setNewMaintenance] = useState<MaintenancePeriod>({
    id: '',
    name: '',
    startDate: '',
    endDate: '',
    recurring: false
  });

  const handleWorkingHoursUpdate = () => {
    // Send to backend to update calendar
    toast({
      title: 'Working Hours Updated',
      description: `Work schedule set to ${workingHours.startTime} - ${workingHours.endTime}`,
    });
  };

  const addMaintenancePeriod = () => {
    if (!newMaintenance.name || !newMaintenance.startDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const maintenance = {
      ...newMaintenance,
      id: Date.now().toString()
    };
    
    setMaintenancePeriods([...maintenancePeriods, maintenance]);
    setNewMaintenance({
      id: '',
      name: '',
      startDate: '',
      endDate: '',
      recurring: false
    });

    toast({
      title: 'Maintenance Period Added',
      description: `${maintenance.name} scheduled successfully`,
    });
  };

  const removeMaintenance = (id: string) => {
    setMaintenancePeriods(maintenancePeriods.filter(m => m.id !== id));
    toast({
      title: 'Maintenance Period Removed',
      description: 'The maintenance period has been deleted',
    });
  };

  const toggleDay = (day: string) => {
    if (workingHours.days.includes(day)) {
      setWorkingHours({
        ...workingHours,
        days: workingHours.days.filter(d => d !== day)
      });
    } else {
      setWorkingHours({
        ...workingHours,
        days: [...workingHours.days, day]
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl" data-testid="calendar-management-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar & Working Time Management
        </CardTitle>
        <CardDescription>
          Configure working hours, maintenance periods, and resource availability
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="working-hours" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="working-hours" data-testid="tab-working-hours">Working Hours</TabsTrigger>
            <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="constraints" data-testid="tab-constraints">Constraint Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="working-hours" className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={workingHours.startTime}
                    onChange={(e) => setWorkingHours({...workingHours, startTime: e.target.value})}
                    data-testid="input-start-time"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={workingHours.endTime}
                    onChange={(e) => setWorkingHours({...workingHours, endTime: e.target.value})}
                    data-testid="input-end-time"
                  />
                </div>
              </div>

              <div>
                <Label>Working Days</Label>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <Button
                      key={day}
                      variant={workingHours.days.includes(day) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDay(day)}
                      data-testid={`button-day-${day.toLowerCase()}`}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={handleWorkingHoursUpdate} className="w-full" data-testid="button-update-hours">
                <Clock className="h-4 w-4 mr-2" />
                Update Working Hours
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenance-name">Maintenance Name</Label>
                  <Input
                    id="maintenance-name"
                    placeholder="e.g., Weekly Cleaning"
                    value={newMaintenance.name}
                    onChange={(e) => setNewMaintenance({...newMaintenance, name: e.target.value})}
                    data-testid="input-maintenance-name"
                  />
                </div>
                <div>
                  <Label htmlFor="maintenance-type">Type</Label>
                  <Select
                    value={newMaintenance.recurring ? 'recurring' : 'one-time'}
                    onValueChange={(value) => setNewMaintenance({...newMaintenance, recurring: value === 'recurring'})}
                  >
                    <SelectTrigger data-testid="select-maintenance-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenance-start">Start Date/Time</Label>
                  <Input
                    id="maintenance-start"
                    type="datetime-local"
                    value={newMaintenance.startDate}
                    onChange={(e) => setNewMaintenance({...newMaintenance, startDate: e.target.value})}
                    data-testid="input-maintenance-start"
                  />
                </div>
                <div>
                  <Label htmlFor="maintenance-end">End Date/Time</Label>
                  <Input
                    id="maintenance-end"
                    type="datetime-local"
                    value={newMaintenance.endDate}
                    onChange={(e) => setNewMaintenance({...newMaintenance, endDate: e.target.value})}
                    data-testid="input-maintenance-end"
                  />
                </div>
              </div>

              {newMaintenance.recurring && (
                <div>
                  <Label htmlFor="maintenance-frequency">Frequency</Label>
                  <Select
                    value={newMaintenance.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                      setNewMaintenance({...newMaintenance, frequency: value})
                    }
                  >
                    <SelectTrigger data-testid="select-maintenance-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={addMaintenancePeriod} className="w-full" data-testid="button-add-maintenance">
                <Plus className="h-4 w-4 mr-2" />
                Add Maintenance Period
              </Button>

              <div className="space-y-2">
                {maintenancePeriods.map(maintenance => (
                  <div key={maintenance.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`maintenance-item-${maintenance.id}`}>
                    <div>
                      <div className="font-medium">{maintenance.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(maintenance.startDate).toLocaleString()} - {maintenance.endDate ? new Date(maintenance.endDate).toLocaleString() : 'Ongoing'}
                      </div>
                      {maintenance.recurring && (
                        <div className="text-xs text-blue-600">Recurring: {maintenance.frequency}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMaintenance(maintenance.id)}
                      data-testid={`button-remove-maintenance-${maintenance.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="constraints" className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Constraint Types Available</p>
                  <ul className="mt-2 space-y-1 text-amber-800">
                    <li>• <strong>MSO/MFO</strong>: Must Start/Finish On (inflexible)</li>
                    <li>• <strong>SNET/FNET</strong>: Start/Finish No Earlier Than</li>
                    <li>• <strong>SNLT/FNLT</strong>: Start/Finish No Later Than</li>
                  </ul>
                  <p className="mt-2 text-amber-700">
                    Constraints are applied per operation. Drag operations to auto-apply SNET/FNET constraints,
                    or set them manually in the operation details.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Auto-Apply Constraints on Drag</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-constraints"
                  defaultChecked
                  data-testid="checkbox-auto-constraints"
                />
                <Label htmlFor="auto-constraints" className="font-normal">
                  Automatically apply SNET/FNET constraints when dragging operations
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Manual Scheduling Override</Label>
              <p className="text-sm text-muted-foreground">
                Operations marked as "manually scheduled" will maintain their positions
                and won't be affected by algorithm changes.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}