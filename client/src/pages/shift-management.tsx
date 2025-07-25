import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { CalendarIcon, Clock, Users, AlertTriangle, Plus, Settings, Calendar as CalendarIconLucide, UserX, UserCheck, BarChart3, TrendingUp, TrendingDown, Sparkles, Bot, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Shift Management Component
export default function ShiftManagement() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("templates");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch shift templates
  const { data: shiftTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/shift-templates', selectedPlant],
    queryFn: async () => {
      const response = await fetch(`/api/shift-templates${selectedPlant !== 'all' ? `?plantId=${selectedPlant}` : ''}`);
      return response.json();
    },
  });

  // Fetch plants for filtering
  const { data: plants = [] } = useQuery({
    queryKey: ['/api/plants'],
  });

  // Fetch resources
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
  });

  // Fetch resource assignments for current week
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/resource-shift-assignments', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(`/api/resource-shift-assignments?startDate=${format(weekStart, 'yyyy-MM-dd')}&endDate=${format(weekEnd, 'yyyy-MM-dd')}`);
      return response.json();
    },
  });

  // Fetch holidays for current month
  const { data: holidays = [] } = useQuery({
    queryKey: ['/api/holidays', selectedDate.getFullYear(), selectedDate.getMonth() + 1],
    queryFn: async () => {
      const response = await fetch(`/api/holidays?year=${selectedDate.getFullYear()}&month=${selectedDate.getMonth() + 1}`);
      return response.json();
    },
  });

  // Fetch absences for current week
  const { data: absences = [] } = useQuery({
    queryKey: ['/api/resource-absences', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(`/api/resource-absences?startDate=${format(weekStart, 'yyyy-MM-dd')}&endDate=${format(weekEnd, 'yyyy-MM-dd')}`);
      return response.json();
    },
  });

  // Fetch shift utilization metrics
  const { data: utilizationData = [] } = useQuery({
    queryKey: ['/api/shift-utilization', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(`/api/shift-utilization?startDate=${format(weekStart, 'yyyy-MM-dd')}&endDate=${format(weekEnd, 'yyyy-MM-dd')}`);
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shift Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage resource shifts, holidays, and absenteeism
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Plant Filter */}
            <Select value={selectedPlant} onValueChange={setSelectedPlant}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Plants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plants</SelectItem>
                {plants.map((plant: any) => (
                  <SelectItem key={plant.id} value={plant.id.toString()}>
                    {plant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-64 justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop: Grid layout, Mobile: Horizontal scrolling */}
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground min-w-full sm:grid sm:w-full sm:grid-cols-6">
              <TabsTrigger value="templates" className="flex-shrink-0 px-3 sm:px-6">
                <span className="hidden sm:inline">Shift Templates</span>
                <span className="sm:hidden">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex-shrink-0 px-3 sm:px-6">
                <span className="hidden sm:inline">Assignments</span>
                <span className="sm:hidden">Assignments</span>
              </TabsTrigger>
              <TabsTrigger value="holidays" className="flex-shrink-0 px-3 sm:px-6">
                <span className="hidden sm:inline">Holidays</span>
                <span className="sm:hidden">Holidays</span>
              </TabsTrigger>
              <TabsTrigger value="absences" className="flex-shrink-0 px-3 sm:px-6">
                <span className="hidden sm:inline">Absences</span>
                <span className="sm:hidden">Absences</span>
              </TabsTrigger>
              <TabsTrigger value="scenarios" className="flex-shrink-0 px-3 sm:px-6">
                <span className="hidden sm:inline">Scenarios</span>
                <span className="sm:hidden">Scenarios</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-shrink-0 px-3 sm:px-6">
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Shift Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <ShiftTemplatesTab 
              templates={shiftTemplates} 
              loading={templatesLoading}
              plants={plants}
            />
          </TabsContent>

          {/* Resource Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <AssignmentsTab 
              assignments={assignments}
              templates={shiftTemplates}
              resources={resources}
              selectedDate={selectedDate}
              loading={assignmentsLoading}
            />
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays" className="space-y-6">
            <HolidaysTab 
              holidays={holidays}
              plants={plants}
              selectedDate={selectedDate}
            />
          </TabsContent>

          {/* Absences Tab */}
          <TabsContent value="absences" className="space-y-6">
            <AbsencesTab 
              absences={absences}
              resources={resources}
              selectedDate={selectedDate}
            />
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <ScenariosTab selectedDate={selectedDate} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab 
              utilizationData={utilizationData}
              templates={shiftTemplates}
              selectedDate={selectedDate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Shift Templates Management Component
function ShiftTemplatesTab({ templates, loading, plants }: any) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch resources for AI shift creation
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
  });

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
          <AIShiftCreationDialog 
            plants={plants}
            resources={resources}
            existingShifts={templates}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/shift-templates'] });
              toast({ title: "Success", description: "AI shift templates created successfully" });
            }}
          />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
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
                  onSubmit={(data) => createTemplateMutation.mutate(data)}
                  isLoading={createTemplateMutation.isPending}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template: any) => (
            <ShiftTemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    );
  }

// Individual Shift Template Card
function ShiftTemplateCard({ template }: any) {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activeDays = template.daysOfWeek?.map((day: number) => daysOfWeek[day]).join(', ') || 'No days set';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          <Badge 
            variant={template.isActive ? "default" : "secondary"}
            style={{ backgroundColor: template.color }}
          >
            {template.shiftType}
          </Badge>
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
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600">+{template.premiumRate}% premium pay</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Settings className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Users className="mr-2 h-4 w-4" />
            Assign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// AI Shift Creation Dialog Component
function AIShiftCreationDialog({ plants, resources, existingShifts, onSuccess }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(z.object({
      requirements: z.string().min(10, "Please provide detailed requirements (minimum 10 characters)"),
      plantId: z.string().optional(),
      shiftType: z.string().optional(),
      objectives: z.string().optional(),
    })),
    defaultValues: {
      requirements: "",
      plantId: "",
      shiftType: "regular",
      objectives: "balanced_coverage",
    },
  });

  const handleAICreation = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('/api/shifts/ai-create', {
        method: 'POST',
        body: {
          requirements: data.requirements,
          plantId: data.plantId ? parseInt(data.plantId) : null,
          resources: resources || [],
          existingShifts: existingShifts || []
        }
      });

      setAiResponse(response);
      
      if (response.success) {
        toast({ 
          title: "AI Analysis Complete", 
          description: "Review the AI-generated shift recommendations below" 
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to generate AI shifts", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImplementShifts = async () => {
    if (!aiResponse?.data?.shiftTemplates?.length) return;
    
    setIsLoading(true);
    try {
      // Create each shift template suggested by AI
      for (const template of aiResponse.data.shiftTemplates) {
        await apiRequest('/api/shift-templates', {
          method: 'POST',
          body: template
        });
      }
      
      setIsOpen(false);
      setAiResponse(null);
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create shift templates", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Create Shifts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            AI Shift Creation Assistant
          </DialogTitle>
          <DialogDescription>
            Describe your shift requirements and let AI create optimized shift templates for your manufacturing operations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!aiResponse ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAICreation)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your shift needs... e.g., 'Need 24/7 coverage with 3 shifts, minimum 5 operators per shift, prefer 8-hour shifts, weekends need reduced staff'"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Plant (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="All plants" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">All plants</SelectItem>
                            {plants?.map((plant: any) => (
                              <SelectItem key={plant.id} value={plant.id.toString()}>
                                {plant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="objectives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Objective</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="balanced_coverage">Balanced Coverage</SelectItem>
                            <SelectItem value="cost_minimization">Cost Minimization</SelectItem>
                            <SelectItem value="productivity_maximization">Productivity Maximization</SelectItem>
                            <SelectItem value="worker_satisfaction">Worker Satisfaction</SelectItem>
                            <SelectItem value="flexibility">Maximum Flexibility</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Bot className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate AI Shifts
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">AI Analysis Results</h3>
                <p className="text-blue-800">{aiResponse.message}</p>
                {aiResponse.data?.reasoning && (
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>Reasoning:</strong> {aiResponse.data.reasoning}
                  </p>
                )}
              </div>

              {aiResponse.data?.shiftTemplates?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Recommended Shift Templates</h3>
                  <div className="space-y-3">
                    {aiResponse.data.shiftTemplates.map((template: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge style={{ backgroundColor: template.color }}>
                            {template.shiftType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Time:</span> {template.startTime} - {template.endTime}
                          </div>
                          <div>
                            <span className="font-medium">Staff:</span> {template.minimumStaffing}-{template.maximumStaffing || '∞'}
                          </div>
                          <div>
                            <span className="font-medium">Days:</span> {template.daysOfWeek?.join(', ') || 'All'}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {aiResponse.data?.recommendations?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">AI Recommendations</h3>
                  <ul className="space-y-2">
                    {aiResponse.data.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setAiResponse(null)}>
                  Generate Again
                </Button>
                <Button 
                  onClick={handleImplementShifts}
                  disabled={isLoading || !aiResponse.data?.shiftTemplates?.length}
                >
                  {isLoading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Implement Shifts
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Create Shift Template Form
function CreateShiftTemplateForm({ plants, onSubmit, isLoading }: any) {
  const form = useForm({
    resolver: zodResolver(z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      plantId: z.string().optional(),
      shiftType: z.string().min(1, "Shift type is required"),
      startTime: z.string().min(1, "Start time is required"),
      endTime: z.string().min(1, "End time is required"),
      daysOfWeek: z.array(z.number()).min(1, "At least one day must be selected"),
      minimumStaffing: z.number().min(1, "Minimum staffing is required"),
      maximumStaffing: z.number().optional(),
      premiumRate: z.number().min(0).default(0),
      color: z.string().default("#3B82F6"),
    })),
    defaultValues: {
      name: "",
      description: "",
      shiftType: "regular",
      startTime: "08:00",
      endTime: "17:00",
      daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
      minimumStaffing: 1,
      premiumRate: 0,
      color: "#3B82F6",
    },
  });

  const daysOfWeek = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input placeholder="Day Shift" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="shiftType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shift Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="overtime">Overtime</SelectItem>
                    <SelectItem value="split">Split</SelectItem>
                    <SelectItem value="rotating">Rotating</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Standard day shift for production..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="daysOfWeek"
          render={() => (
            <FormItem>
              <FormLabel>Days of Week</FormLabel>
              <div className="grid grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <FormField
                    key={day.value}
                    control={form.control}
                    name="daysOfWeek"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={day.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(day.value)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, day.value])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== day.value
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {day.label}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="minimumStaffing"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Staff</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="maximumStaffing"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Staff (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="premiumRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Premium Rate (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    max="300"
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Additional pay percentage for this shift</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline">Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Placeholder components for other tabs (simplified for brevity)
function AssignmentsTab({ assignments, templates, resources, selectedDate, loading }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Shift Assignments</CardTitle>
        <CardDescription>
          Assign resources to shifts for the week of {format(selectedDate, "MMM dd, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading assignments...</div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Assignment management interface will be implemented here
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HolidaysTab({ holidays, plants, selectedDate }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holiday Management</CardTitle>
        <CardDescription>
          Manage company holidays and plant-specific closures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Holiday management interface will be implemented here
        </div>
      </CardContent>
    </Card>
  );
}

function AbsencesTab({ absences, resources, selectedDate }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Absences</CardTitle>
        <CardDescription>
          Track and manage resource absences and coverage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Absence management interface will be implemented here
        </div>
      </CardContent>
    </Card>
  );
}

function ScenariosTab({ selectedDate }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Scenarios</CardTitle>
        <CardDescription>
          Test different shift configurations and their impact on capacity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Scenario planning interface will be implemented here
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsTab({ utilizationData, templates, selectedDate }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Utilization Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Shift utilization analytics will be implemented here
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Absentee Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Absentee analytics will be implemented here
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Capacity Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Capacity impact analytics will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}