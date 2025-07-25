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
  Plus, Building2, Brain, ChevronLeft, Trash2 
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

  return (
    <div className="min-h-screen bg-background">
      <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12 transition-all duration-200`}>
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
                <div className="overflow-x-auto">
                  <TabsList className="grid w-max grid-cols-6 gap-1">
                    <TabsTrigger value="templates" className="text-xs px-2">Templates</TabsTrigger>
                    <TabsTrigger value="assignments" className="text-xs px-2">Assign</TabsTrigger>
                    <TabsTrigger value="holidays" className="text-xs px-2">Holidays</TabsTrigger>
                    <TabsTrigger value="absences" className="text-xs px-2">Absences</TabsTrigger>
                    <TabsTrigger value="scenarios" className="text-xs px-2">Scenarios</TabsTrigger>
                    <TabsTrigger value="analytics" className="text-xs px-2">Analytics</TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Desktop Tabs */}
              <div className="hidden sm:block">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="templates">Shift Templates</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                  <TabsTrigger value="holidays">Holidays</TabsTrigger>
                  <TabsTrigger value="absences">Absences</TabsTrigger>
                  <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                <AssignmentsTab />
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
    mutationFn: (data: any) => apiRequest('/api/shift-templates', { method: 'POST', body: data }),
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
function AssignmentsTab() {
  return (
    <div className="text-center p-8">
      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Shift Assignments</h3>
      <p className="text-muted-foreground">
        Assign resources to specific shifts and manage scheduling
      </p>
    </div>
  );
}

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