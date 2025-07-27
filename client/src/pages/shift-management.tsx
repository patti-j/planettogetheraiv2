import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Clock, Users, Calendar, Settings, BarChart3, 
  Plus, Building2, Brain, ChevronLeft, Trash2, UserCheck, 
  ArrowRight, CheckCircle, AlertCircle, Edit, AlertTriangle,
  Wrench, Timer, DollarSign, User, MapPin, FileText,
  PlayCircle, PauseCircle, StopCircle, Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { apiRequest } from '@/lib/queryClient';

export default function ShiftManagement() {
  const { isMaxOpen } = useMaxDock();
  const [activeTab, setActiveTab] = useState('templates');

  // Fetch data
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/shift-templates'],
  });

  const { data: plants = [] } = useQuery({
    queryKey: ['/api/plants'],
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/resource-shift-assignments'],
  });

  const { data: unplannedDowntime = [], isLoading: downtimeLoading } = useQuery({
    queryKey: ['/api/unplanned-downtime'],
  });

  const { data: overtimeShifts = [], isLoading: overtimeLoading } = useQuery({
    queryKey: ['/api/overtime-shifts'],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className={`${isMaxOpen ? 'md:ml-0 md:mr-0' : 'md:ml-12 md:mr-12'} ml-3 mr-3 transition-all duration-200`}>
        <div className="p-4 md:p-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Shift Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage shift templates, assignments, and workforce scheduling
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              
              {/* Mobile Tabs */}
              <div className="block sm:hidden">
                <div className="flex justify-center">
                  <div className="overflow-x-auto">
                    <TabsList className="flex w-max gap-1 justify-center">
                      <TabsTrigger value="templates" className="text-xs px-2 flex-shrink-0">Templates</TabsTrigger>
                      <TabsTrigger value="assignments" className="text-xs px-2 flex-shrink-0">Assign</TabsTrigger>
                      <TabsTrigger value="downtime" className="text-xs px-2 flex-shrink-0">Downtime</TabsTrigger>
                      <TabsTrigger value="overtime" className="text-xs px-2 flex-shrink-0">Overtime</TabsTrigger>
                      <TabsTrigger value="holidays" className="text-xs px-2 flex-shrink-0">Holidays</TabsTrigger>
                      <TabsTrigger value="absences" className="text-xs px-2 flex-shrink-0">Absences</TabsTrigger>
                      <TabsTrigger value="scenarios" className="text-xs px-2 flex-shrink-0">Scenarios</TabsTrigger>
                      <TabsTrigger value="analytics" className="text-xs px-2 flex-shrink-0">Analytics</TabsTrigger>
                    </TabsList>
                  </div>
                </div>
              </div>

              {/* Desktop Tabs */}
              <div className="hidden sm:block">
                <TabsList className="flex flex-wrap w-full gap-1 h-auto p-2">
                  <TabsTrigger value="templates" className="flex-shrink-0">Templates</TabsTrigger>
                  <TabsTrigger value="assignments" className="flex-shrink-0">Assignments</TabsTrigger>
                  <TabsTrigger value="downtime" className="flex-shrink-0">Downtime</TabsTrigger>
                  <TabsTrigger value="overtime" className="flex-shrink-0">Overtime</TabsTrigger>
                  <TabsTrigger value="holidays" className="flex-shrink-0">Holidays</TabsTrigger>
                  <TabsTrigger value="absences" className="flex-shrink-0">Absences</TabsTrigger>
                  <TabsTrigger value="scenarios" className="flex-shrink-0">Scenarios</TabsTrigger>
                  <TabsTrigger value="analytics" className="flex-shrink-0">Analytics</TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Contents */}
              <TabsContent value="templates" className="space-y-6">
                <ShiftTemplatesTab 
                  templates={templates} 
                  loading={templatesLoading} 
                  plants={plants}
                  resources={resources}
                />
              </TabsContent>

              <TabsContent value="assignments" className="space-y-6">
                <AssignmentsTab 
                  assignments={assignments}
                  loading={assignmentsLoading}
                  templates={templates}
                  resources={resources}
                  plants={plants}
                />
              </TabsContent>

              <TabsContent value="downtime" className="space-y-6">
                <UnplannedDowntimeTab 
                  downtime={unplannedDowntime}
                  loading={downtimeLoading}
                  resources={resources}
                  users={users}
                  plants={plants}
                />
              </TabsContent>

              <TabsContent value="overtime" className="space-y-6">
                <OvertimeShiftsTab 
                  overtimeShifts={overtimeShifts}
                  loading={overtimeLoading}
                  resources={resources}
                  templates={templates}
                  users={users}
                  plants={plants}
                />
              </TabsContent>

              <TabsContent value="holidays" className="space-y-6">
                <HolidaysTab />
              </TabsContent>

              <TabsContent value="absences" className="space-y-6">
                <AbsencesTab />
              </TabsContent>

              <TabsContent value="scenarios" className="space-y-6">
                <ScenariosTab />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <AnalyticsTab />
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shift Templates Tab Component
function ShiftTemplatesTab({ templates, loading, plants, resources }: any) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/shift-templates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shift-templates'] });
      toast({ title: "Success", description: "Shift template created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (loading) {
    return <div className="flex justify-center p-8">Loading shift templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Shift Templates</h2>
        <div className="flex gap-2">
          {/* AI Shift Creation Button */}
          <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Brain className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">AI Create Shifts</span>
                <span className="sm:hidden">AI</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>AI Shift Creation</DialogTitle>
                <DialogDescription>
                  Describe your shift requirements in natural language and let AI create optimized shift templates
                </DialogDescription>
              </DialogHeader>
              <AIShiftCreationForm 
                plants={plants}
                resources={resources}
                onClose={() => setIsAIDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Regular Create Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Create Template</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Shift Template</DialogTitle>
                <DialogDescription>
                  Define a new shift pattern for your resources
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                <CreateShiftTemplateForm 
                  plants={plants}
                  onSubmit={(data: any) => createTemplateMutation.mutate(data)}
                  isLoading={createTemplateMutation.isPending}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template: any) => (
          <ShiftTemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}

// AI Shift Creation Form
function AIShiftCreationForm({ plants, resources, onClose }: any) {
  const [requirements, setRequirements] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAICreation = async () => {
    if (!requirements.trim()) {
      toast({ title: "Error", description: "Please describe your shift requirements", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/api/shifts/ai-create', {
        method: 'POST',
        body: {
          requirements,
          plants,
          resources
        }
      });

      setAiResponse(response);
      toast({ title: "Success", description: "AI has generated shift recommendations!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImplementShifts = async () => {
    if (!aiResponse?.shifts) return;

    setIsLoading(true);
    try {
      for (const shift of aiResponse.shifts) {
        await apiRequest('/api/shift-templates', {
          method: 'POST',
          body: shift
        });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/shift-templates'] });
      toast({ title: "Success", description: "AI shift templates implemented successfully!" });
      onClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor="requirements">Shift Requirements</Label>
        <Textarea
          id="requirements"
          placeholder="Describe your shift needs... e.g., 'Need 24/7 coverage with 3 shifts, minimum 5 operators per shift, rotating schedule for weekends'"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          rows={4}
        />
      </div>

      {!aiResponse && (
        <Button 
          onClick={handleAICreation}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {isLoading ? "Generating..." : "Generate AI Shifts"}
        </Button>
      )}

      {aiResponse && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">AI Recommendations</h3>
            <p className="text-green-700 mb-4">{aiResponse.reasoning}</p>
            
            <div className="space-y-3">
              {aiResponse.shifts?.map((shift: any, index: number) => (
                <div key={index} className="p-3 bg-white border rounded">
                  <h4 className="font-medium">{shift.name}</h4>
                  <p className="text-sm text-gray-600">{shift.description}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Time: {shift.startTime} - {shift.endTime}</span>
                    <span>Staff: {shift.minimumStaffing}-{shift.maximumStaffing}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleImplementShifts}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isLoading ? "Implementing..." : "Implement Shifts"}
            </Button>
            <Button variant="outline" onClick={() => setAiResponse(null)}>
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Shift Template Form
function CreateShiftTemplateForm({ plants, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shiftType: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [] as number[],
    minimumStaffing: 1,
    maximumStaffing: 10,
    plantId: '',
    color: '#3b82f6',
    premiumRate: 0,
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDayToggle = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayIndex)
        ? prev.daysOfWeek.filter(d => d !== dayIndex)
        : [...prev.daysOfWeek, dayIndex]
    }));
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shiftType">Shift Type</Label>
          <Select value={formData.shiftType} onValueChange={(value) => setFormData(prev => ({ ...prev, shiftType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select shift type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day Shift</SelectItem>
              <SelectItem value="night">Night Shift</SelectItem>
              <SelectItem value="swing">Swing Shift</SelectItem>
              <SelectItem value="rotating">Rotating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minimumStaffing">Minimum Staff</Label>
          <Input
            id="minimumStaffing"
            type="number"
            min="1"
            value={formData.minimumStaffing}
            onChange={(e) => setFormData(prev => ({ ...prev, minimumStaffing: parseInt(e.target.value) }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maximumStaffing">Maximum Staff</Label>
          <Input
            id="maximumStaffing"
            type="number"
            min="1"
            value={formData.maximumStaffing}
            onChange={(e) => setFormData(prev => ({ ...prev, maximumStaffing: parseInt(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Active Days</Label>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {daysOfWeek.map((day, index) => (
            <Button
              key={index}
              type="button"
              variant={formData.daysOfWeek.includes(index) ? "default" : "outline"}
              size="sm"
              onClick={() => handleDayToggle(index)}
              className="text-xs"
            >
              {day.slice(0, 3)}
            </Button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating..." : "Create Template"}
      </Button>
    </form>
  );
}

// Edit Shift Template Form
function EditShiftTemplateForm({ template, onSubmit, onDelete, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: template.name || '',
    description: template.description || '',
    shiftType: template.shiftType || '',
    startTime: template.startTime || '',
    endTime: template.endTime || '',
    daysOfWeek: template.daysOfWeek || [],
    minimumStaffing: template.minimumStaffing || 1,
    maximumStaffing: template.maximumStaffing || 10,
    plantId: template.plantId || '',
    color: template.color || '#3b82f6',
    premiumRate: template.premiumRate || 0,
    isActive: template.isActive !== undefined ? template.isActive : true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDayToggle = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayIndex)
        ? prev.daysOfWeek.filter((d: number) => d !== dayIndex)
        : [...prev.daysOfWeek, dayIndex]
    }));
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Template Name</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-shiftType">Shift Type</Label>
          <Select value={formData.shiftType} onValueChange={(value) => setFormData(prev => ({ ...prev, shiftType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select shift type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day Shift</SelectItem>
              <SelectItem value="night">Night Shift</SelectItem>
              <SelectItem value="swing">Swing Shift</SelectItem>
              <SelectItem value="rotating">Rotating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-startTime">Start Time</Label>
          <Input
            id="edit-startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-endTime">End Time</Label>
          <Input
            id="edit-endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-minimumStaffing">Minimum Staff</Label>
          <Input
            id="edit-minimumStaffing"
            type="number"
            min="1"
            value={formData.minimumStaffing}
            onChange={(e) => setFormData(prev => ({ ...prev, minimumStaffing: parseInt(e.target.value) }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-maximumStaffing">Maximum Staff</Label>
          <Input
            id="edit-maximumStaffing"
            type="number"
            min="1"
            value={formData.maximumStaffing}
            onChange={(e) => setFormData(prev => ({ ...prev, maximumStaffing: parseInt(e.target.value) }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-color">Template Color</Label>
          <Input
            id="edit-color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-premiumRate">Premium Rate (%)</Label>
          <Input
            id="edit-premiumRate"
            type="number"
            min="0"
            step="0.1"
            value={formData.premiumRate}
            onChange={(e) => setFormData(prev => ({ ...prev, premiumRate: parseFloat(e.target.value) }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Active Days</Label>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {daysOfWeek.map((day, index) => (
            <Button
              key={index}
              type="button"
              variant={formData.daysOfWeek.includes(index) ? "default" : "outline"}
              size="sm"
              onClick={() => handleDayToggle(index)}
              className="text-xs"
            >
              {day.slice(0, 3)}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="edit-isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="edit-isActive">Template is active</Label>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Updating..." : "Update Template"}
        </Button>
        <Button 
          type="button" 
          variant="destructive" 
          onClick={onDelete}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </form>
  );
}

// Assignments Tab Component
function AssignmentsTab({ assignments, loading, templates, resources, plants }: any) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/resource-shift-assignments', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resource-shift-assignments'] });
      toast({ title: "Success", description: "Shift assignment created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (loading) {
    return <div className="flex justify-center p-8">Loading shift assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Shift Assignments</h2>
        <div className="flex gap-2">
          {/* AI Assignment Button */}
          <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Brain className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">AI Assign Shifts</span>
                <span className="sm:hidden">AI</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>AI Shift Assignment</DialogTitle>
                <DialogDescription>
                  Let AI automatically assign shifts to resources based on requirements and availability
                </DialogDescription>
              </DialogHeader>
              <AIShiftAssignmentForm 
                templates={templates}
                resources={resources}
                plants={plants}
                onClose={() => setIsAIDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Manual Assignment Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserCheck className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Manual Assign</span>
                <span className="sm:hidden">Assign</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manual Shift Assignment</DialogTitle>
                <DialogDescription>
                  Manually assign shift templates to specific resources
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                <ManualShiftAssignmentForm 
                  templates={templates}
                  resources={resources}
                  plants={plants}
                  onSubmit={(data: any) => createAssignmentMutation.mutate(data)}
                  isLoading={createAssignmentMutation.isPending}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No shift assignments</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by assigning shifts to your resources
            </p>
          </div>
        ) : (
          assignments.map((assignment: any) => (
            <ShiftAssignmentCard key={assignment.id} assignment={assignment} />
          ))
        )}
      </div>
    </div>
  );
}

// AI Shift Assignment Form
function AIShiftAssignmentForm({ templates, resources, plants, onClose }: any) {
  const [requirements, setRequirements] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAIAssignment = async () => {
    if (!requirements.trim()) {
      toast({ title: "Error", description: "Please describe your assignment requirements", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/api/shifts/ai-assign', {
        method: 'POST',
        body: {
          requirements,
          templates,
          resources,
          plants
        }
      });

      queryClient.invalidateQueries({ queryKey: ['/api/resource-shift-assignments'] });
      toast({ title: "Success", description: "AI assignment completed successfully" });
      onClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ai-assignment-requirements">Assignment Requirements</Label>
        <Textarea
          id="ai-assignment-requirements"
          placeholder="Example: Assign day shift to all CNC operators in Main Plant starting next Monday, ensure 24/7 coverage for welding department with rotating shifts..."
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          rows={6}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">
          Describe your shift assignment needs in detail. Include resource types, plants, time periods, and coverage requirements.
        </p>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleAIAssignment} disabled={isLoading} className="flex-1">
          {isLoading ? "Processing..." : "Generate AI Assignments"}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Manual Shift Assignment Form
function ManualShiftAssignmentForm({ templates, resources, plants, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    resourceId: '',
    shiftTemplateId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: '',
    assignedBy: 6, // Assuming current user ID
    notes: '',
    isTemporary: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      resourceId: parseInt(formData.resourceId),
      shiftTemplateId: parseInt(formData.shiftTemplateId),
      effectiveDate: new Date(formData.effectiveDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
    };
    
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assignment-resource">Resource</Label>
          <Select value={formData.resourceId} onValueChange={(value) => setFormData(prev => ({ ...prev, resourceId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select resource" />
            </SelectTrigger>
            <SelectContent>
              {resources.map((resource: any) => (
                <SelectItem key={resource.id} value={resource.id.toString()}>
                  {resource.name} ({resource.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignment-template">Shift Template</Label>
          <Select value={formData.shiftTemplateId} onValueChange={(value) => setFormData(prev => ({ ...prev, shiftTemplateId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select shift template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template: any) => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  {template.name} ({template.startTime} - {template.endTime})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignment-start">Start Date</Label>
          <Input
            id="assignment-start"
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignment-end">End Date (Optional)</Label>
          <Input
            id="assignment-end"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignment-notes">Notes</Label>
        <Textarea
          id="assignment-notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          placeholder="Optional notes about this assignment..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="assignment-temporary"
          checked={formData.isTemporary}
          onChange={(e) => setFormData(prev => ({ ...prev, isTemporary: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="assignment-temporary">Temporary assignment (overtime, vacation coverage, etc.)</Label>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Creating..." : "Create Assignment"}
        </Button>
      </div>
    </form>
  );
}

// Shift Assignment Card
function ShiftAssignmentCard({ assignment }: any) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAssignmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/resource-shift-assignments/${assignment.id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resource-shift-assignments'] });
      toast({ title: "Success", description: "Assignment updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: () => apiRequest(`/api/resource-shift-assignments/${assignment.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resource-shift-assignments'] });
      toast({ title: "Success", description: "Assignment deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <CardTitle className="text-lg">
                {assignment.resourceName || `Resource ${assignment.resourceId}`}
              </CardTitle>
              <CardDescription>
                {assignment.shiftTemplateName || `Template ${assignment.shiftTemplateId}`}
              </CardDescription>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {assignment.startTime || '00:00'} - {assignment.endTime || '00:00'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={assignment.status === 'active' ? 'default' : 'secondary'}
              className={assignment.isTemporary ? 'bg-orange-100 text-orange-800' : ''}
            >
              {assignment.isTemporary ? 'Temporary' : assignment.status || 'active'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Start Date:</span>
            <p className="text-muted-foreground">{formatDate(assignment.effectiveDate)}</p>
          </div>
          <div>
            <span className="font-medium">End Date:</span>
            <p className="text-muted-foreground">
              {assignment.endDate ? formatDate(assignment.endDate) : 'Indefinite'}
            </p>
          </div>
          {assignment.notes && (
            <div className="col-span-2">
              <span className="font-medium">Notes:</span>
              <p className="text-muted-foreground">{assignment.notes}</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shift Assignment</DialogTitle>
            <DialogDescription>
              Modify the assignment details
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <EditShiftAssignmentForm 
              assignment={assignment}
              onSubmit={(data: any) => updateAssignmentMutation.mutate(data)}
              onDelete={() => deleteAssignmentMutation.mutate()}
              isLoading={updateAssignmentMutation.isPending || deleteAssignmentMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Edit Shift Assignment Form
function EditShiftAssignmentForm({ assignment, onSubmit, onDelete, isLoading }: any) {
  const [formData, setFormData] = useState({
    effectiveDate: assignment.effectiveDate ? assignment.effectiveDate.split('T')[0] : '',
    endDate: assignment.endDate ? assignment.endDate.split('T')[0] : '',
    notes: assignment.notes || '',
    isTemporary: assignment.isTemporary || false,
    status: assignment.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      effectiveDate: new Date(formData.effectiveDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
    };
    
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-start">Start Date</Label>
          <Input
            id="edit-start"
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-end">End Date (Optional)</Label>
          <Input
            id="edit-end"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-notes">Notes</Label>
        <Textarea
          id="edit-notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="edit-temporary"
          checked={formData.isTemporary}
          onChange={(e) => setFormData(prev => ({ ...prev, isTemporary: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="edit-temporary">Temporary assignment</Label>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Updating..." : "Update Assignment"}
        </Button>
        <Button 
          type="button" 
          variant="destructive" 
          onClick={onDelete}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </form>
  );
}

// Individual Shift Template Card
function ShiftTemplateCard({ template }: any) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activeDays = template.daysOfWeek?.map((day: number) => daysOfWeek[day]).join(', ') || 'No days set';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/shift-templates/${template.id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shift-templates'] });
      toast({ title: "Success", description: "Shift template updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: () => apiRequest(`/api/shift-templates/${template.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shift-templates'] });
      toast({ title: "Success", description: "Shift template deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={template.isActive ? "default" : "secondary"}
              style={{ backgroundColor: template.color }}
            >
              {template.shiftType}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{template.startTime} - {template.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{template.minimumStaffing}-{template.maximumStaffing || '∞'}</span>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-1">Active Days:</p>
          <p className="text-sm text-muted-foreground">{activeDays}</p>
        </div>

        {template.premiumRate > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Premium Rate:</span>
            <span className="text-sm text-green-600">+{template.premiumRate}%</span>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shift Template</DialogTitle>
            <DialogDescription>
              Modify the shift template settings
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <EditShiftTemplateForm 
              template={template}
              onSubmit={(data: any) => updateTemplateMutation.mutate(data)}
              onDelete={() => deleteTemplateMutation.mutate()}
              isLoading={updateTemplateMutation.isPending || deleteTemplateMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Placeholder components for other tabs

function HolidaysTab() {
  return (
    <div className="text-center p-8">
      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Holiday Management</h3>
      <p className="text-muted-foreground">
        Configure holidays and special schedules
      </p>
    </div>
  );
}

function AbsencesTab() {
  return (
    <div className="text-center p-8">
      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Absence Tracking</h3>
      <p className="text-muted-foreground">
        Track and manage employee absences and coverage
      </p>
    </div>
  );
}

function ScenariosTab() {
  return (
    <div className="text-center p-8">
      <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Scenario Planning</h3>
      <p className="text-muted-foreground">
        Test different staffing scenarios and capacity planning
      </p>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div className="text-center p-8">
      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Shift Analytics</h3>
      <p className="text-muted-foreground">
        Analyze shift performance and utilization metrics
      </p>
    </div>
  );
}

// Unplanned Downtime Tab Component
function UnplannedDowntimeTab({ downtime, loading, resources, users, plants }: any) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createDowntimeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/unplanned-downtime', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/unplanned-downtime'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Downtime reported",
        description: "Unplanned downtime event has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create downtime event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading downtime events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Unplanned Downtime Management</h2>
          <p className="text-muted-foreground">
            Track equipment failures, maintenance, and disruption coverage
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Downtime
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Events</p>
                <p className="text-xl font-semibold">
                  {downtime.filter((d: any) => d.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wrench className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-xl font-semibold">
                  {downtime.filter((d: any) => d.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
                <p className="text-xl font-semibold">
                  {downtime.filter((d: any) => d.status === 'resolved' && 
                    new Date(d.actualEndTime).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Timer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-xl font-semibold">
                  {downtime.length > 0 ? 
                    Math.round(downtime.reduce((sum: number, d: any) => sum + (d.downtimeMinutes || 0), 0) / downtime.length) 
                    : 0} min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downtime Events List */}
      <div className="space-y-4">
        {downtime.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Downtime Events</h3>
              <p className="text-muted-foreground">
                Great! No unplanned downtime events are currently recorded.
              </p>
            </CardContent>
          </Card>
        ) : (
          downtime.map((event: any) => (
            <DowntimeEventCard 
              key={event.id} 
              event={event} 
              resources={resources}
              users={users}
              getSeverityColor={getSeverityColor}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </div>

      {/* Create Downtime Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Unplanned Downtime</DialogTitle>
            <DialogDescription>
              Report equipment failure, maintenance issue, or unexpected disruption
            </DialogDescription>
          </DialogHeader>
          <CreateDowntimeForm 
            resources={resources}
            users={users}
            plants={plants}
            onSubmit={(data: any) => createDowntimeMutation.mutate(data)}
            isLoading={createDowntimeMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Overtime Shifts Tab Component
function OvertimeShiftsTab({ overtimeShifts, loading, resources, templates, users, plants }: any) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createOvertimeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/overtime-shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/overtime-shifts'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Overtime scheduled",
        description: "Overtime shift has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create overtime shift. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getOvertimeTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'coverage': return 'bg-orange-100 text-orange-800';
      case 'project': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading overtime shifts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Overtime Shift Management</h2>
          <p className="text-muted-foreground">
            Schedule emergency coverage, project overtime, and maintenance shifts
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Overtime
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Shifts</p>
                <p className="text-xl font-semibold">
                  {overtimeShifts.filter((s: any) => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-xl font-semibold">
                  {overtimeShifts.filter((s: any) => s.status === 'requested').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week Cost</p>
                <p className="text-xl font-semibold">
                  ${overtimeShifts.reduce((sum: number, s: any) => sum + (s.actualCost || s.estimatedCost || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emergency</p>
                <p className="text-xl font-semibold">
                  {overtimeShifts.filter((s: any) => s.isEmergency).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overtime Shifts List */}
      <div className="space-y-4">
        {overtimeShifts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Overtime Shifts</h3>
              <p className="text-muted-foreground">
                No overtime shifts are currently scheduled.
              </p>
            </CardContent>
          </Card>
        ) : (
          overtimeShifts.map((shift: any) => (
            <OvertimeShiftCard 
              key={shift.id} 
              shift={shift} 
              resources={resources}
              templates={templates}
              users={users}
              getOvertimeTypeColor={getOvertimeTypeColor}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </div>

      {/* Create Overtime Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Overtime Shift</DialogTitle>
            <DialogDescription>
              Create emergency coverage, project overtime, or maintenance shift
            </DialogDescription>
          </DialogHeader>
          <CreateOvertimeForm 
            resources={resources}
            templates={templates}
            users={users}
            plants={plants}
            onSubmit={(data: any) => createOvertimeMutation.mutate(data)}
            isLoading={createOvertimeMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
// Missing Component Definitions
function DowntimeEventCard({ event, resources, users, getStatusColor, getSeverityColor }: any) {
  const resource = resources.find((r: any) => r.id === event.resourceId);
  const reporter = users.find((u: any) => u.id === event.reportedBy);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h3 className="font-medium">{event.title}</h3>
              <Badge className={getSeverityColor(event.severity)}>
                {event.severity}
              </Badge>
              <Badge className={getStatusColor(event.status)}>
                {event.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          </div>
          <div className="text-right">
            {event.downtimeMinutes > 0 && (
              <div className="text-sm font-medium text-red-600">
                {Math.round(event.downtimeMinutes / 60)}h downtime
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateDowntimeForm({ resources, users, plants, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    resourceId: '',
    downtimeType: 'equipment_failure',
    severity: 'medium',
    title: '',
    description: '',
    reportedBy: users[0]?.id || '',
    plantId: plants[0]?.id || '',
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      resourceId: parseInt(formData.resourceId),
      reportedBy: parseInt(formData.reportedBy),
      plantId: parseInt(formData.plantId),
      startTime: new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resource">Resource</Label>
        <Select value={formData.resourceId} onValueChange={(value) => setFormData({...formData, resourceId: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select resource" />
          </SelectTrigger>
          <SelectContent>
            {resources.map((resource: any) => (
              <SelectItem key={resource.id} value={resource.id.toString()}>
                {resource.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="Brief description of the issue"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Detailed description of the downtime event"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Report Downtime'}
        </Button>
      </div>
    </form>
  );
}

function OvertimeShiftCard({ shift, resources, templates, users, getOvertimeTypeColor, getStatusColor }: any) {
  const resource = resources.find((r: any) => r.id === shift.resourceId);
  const requester = users.find((u: any) => u.id === shift.requestedBy);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <h3 className="font-medium">{shift.overtimeType.replace('_', ' ')}</h3>
              <Badge className={getStatusColor(shift.status)}>
                {shift.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {shift.reason}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-green-600">
              {formatCurrency(shift.estimatedCost)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateOvertimeForm({ resources, templates, users, plants, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    resourceId: '',
    overtimeType: 'planned_overtime',
    reason: '',
    startTime: '',
    endTime: '',
    requestedBy: users[0]?.id || '',
    premiumMultiplier: 150,
    plantId: plants[0]?.id || '',
    isEmergency: false,
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      resourceId: parseInt(formData.resourceId),
      requestedBy: parseInt(formData.requestedBy),
      plantId: parseInt(formData.plantId),
      estimatedCost: 5000, // $50 placeholder
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resource">Resource</Label>
        <Select value={formData.resourceId} onValueChange={(value) => setFormData({...formData, resourceId: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select resource" />
          </SelectTrigger>
          <SelectContent>
            {resources.map((resource: any) => (
              <SelectItem key={resource.id} value={resource.id.toString()}>
                {resource.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({...formData, reason: e.target.value})}
          placeholder="Reason for overtime shift"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Request Overtime'}
        </Button>
      </div>
    </form>
  );
}
