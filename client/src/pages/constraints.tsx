import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertTriangle, Shield, AlertCircle, Settings, Plus, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import type { Constraint, ConstraintCategory, ConstraintViolation, ConstraintException } from "@shared/schema";

// Form Schemas
const constraintCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  constraintType: z.enum(["physical", "policy", "quality", "safety", "regulatory", "environmental"]),
  parentCategoryId: z.number().optional(),
  isActive: z.boolean().default(true),
});

const constraintSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  categoryId: z.number().min(1, "Category is required"),
  scope: z.enum(["global", "plant", "resource", "item", "operation"]),
  severityLevel: z.enum(["hard", "soft"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  constraintRule: z.object({
    field: z.string(),
    operator: z.enum(["=", "!=", "<", ">", "<=", ">=", "between", "in", "not_in"]),
    value: z.any(),
  }),
  impactDescription: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function ConstraintsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: constraintCategories = [] } = useQuery<ConstraintCategory[]>({
    queryKey: ["/api/constraint-categories"],
    enabled: true,
  });

  const { data: constraints = [] } = useQuery<Constraint[]>({
    queryKey: ["/api/constraints"],
    enabled: true,
  });

  const { data: violations = [] } = useQuery<ConstraintViolation[]>({
    queryKey: ["/api/constraint-violations"],
    enabled: true,
  });

  const { data: violationsSummary } = useQuery<any>({
    queryKey: ["/api/constraint-violations/summary"],
    enabled: true,
  });

  return (
    <div className="space-y-6 p-4 pt-16">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Constraints Management</h1>
          <p className="text-muted-foreground">
            Manage manufacturing constraints, monitor violations, and ensure compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="buffers">Buffers</TabsTrigger>
          <TabsTrigger value="dbr">DBR Schedule</TabsTrigger>
          <TabsTrigger value="throughput">Throughput</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ConstraintsOverview 
            summary={violationsSummary}
            constraints={constraints}
            violations={violations}
          />
        </TabsContent>

        <TabsContent value="bottlenecks">
          <BottleneckAnalysis />
        </TabsContent>

        <TabsContent value="buffers">
          <BufferManagement />
        </TabsContent>

        <TabsContent value="dbr">
          <DrumBufferRopeSchedule />
        </TabsContent>

        <TabsContent value="throughput">
          <ThroughputAccounting />
        </TabsContent>

        <TabsContent value="constraints">
          <ConstraintsManagement 
            constraints={constraints}
            categories={constraintCategories}
            queryClient={queryClient}
            toast={toast}
          />
        </TabsContent>

        <TabsContent value="violations">
          <ViolationsManagement 
            violations={violations}
            constraints={constraints}
            queryClient={queryClient}
            toast={toast}
          />
        </TabsContent>

        <TabsContent value="monitoring">
          <ConstraintsMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Overview Component
function ConstraintsOverview({ summary, constraints, violations }: {
  summary: any;
  constraints: Constraint[];
  violations: ConstraintViolation[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Constraints</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{constraints.length}</div>
            <p className="text-xs text-muted-foreground">
              {constraints.filter(c => c.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary?.open || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.critical || 0} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Violations</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary?.critical || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.resolved || 0}</div>
            <p className="text-xs text-muted-foreground">
              All violations resolved
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Violations</CardTitle>
            <CardDescription>Latest constraint violations requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {violations.slice(0, 5).map((violation) => (
                <div key={violation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{violation.impactDescription}</p>
                    <p className="text-sm text-muted-foreground">
                      {violation.violationEntityType} ID: {violation.violationEntityId}
                    </p>
                  </div>
                  <Badge 
                    variant={violation.violationSeverity === 'critical' ? 'destructive' : 
                            violation.violationSeverity === 'major' ? 'default' : 'secondary'}
                  >
                    {violation.violationSeverity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Constraint Distribution</CardTitle>
            <CardDescription>Constraints by type and severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Hard Constraints</span>
                <Badge variant="destructive">
                  {constraints.filter(c => c.severityLevel === 'hard').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Soft Constraints</span>
                <Badge variant="secondary">
                  {constraints.filter(c => c.severityLevel === 'soft').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Global Scope</span>
                <Badge variant="outline">
                  {constraints.filter(c => c.scope === 'global').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Plant Scope</span>
                <Badge variant="outline">
                  {constraints.filter(c => c.scope === 'plant').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Constraint Categories Component
function ConstraintCategories({ categories, queryClient, toast }: {
  categories: ConstraintCategory[];
  queryClient: any;
  toast: any;
}) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/constraint-categories", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/constraint-categories"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Category created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating category", 
        description: error.response?.data?.error || "Something went wrong",
        variant: "destructive" 
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(constraintCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      constraintType: "physical" as const,
      isActive: true,
    },
  });

  const onSubmit = (data: any) => {
    createCategoryMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Constraint Categories</h2>
          <p className="text-muted-foreground">Organize constraints by type and category</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Constraint Category</DialogTitle>
              <DialogDescription>
                Create a new category to organize your constraints
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Category description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="constraintType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select constraint type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="physical">Physical</SelectItem>
                          <SelectItem value="policy">Policy</SelectItem>
                          <SelectItem value="quality">Quality</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                          <SelectItem value="regulatory">Regulatory</SelectItem>
                          <SelectItem value="environmental">Environmental</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCategoryMutation.isPending}
                  >
                    {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
                <Badge variant="outline">
                  {(category as any).constraintType || 'General'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Status: {category.isActive ? "Active" : "Inactive"}</span>
                <span>ID: {category.id}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Constraints Management Component  
function ConstraintsManagement({ constraints, categories, queryClient, toast }: {
  constraints: Constraint[];
  categories: ConstraintCategory[];
  queryClient: any;
  toast: any;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Constraints</h2>
          <p className="text-muted-foreground">Manage manufacturing constraints and rules</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Constraint
        </Button>
      </div>

      <div className="space-y-4">
        {constraints.map((constraint) => (
          <Card key={constraint.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{constraint.name}</CardTitle>
                  <CardDescription>{constraint.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={constraint.severityLevel === 'hard' ? 'destructive' : 'secondary'}>
                    {constraint.severityLevel}
                  </Badge>
                  <Badge variant="outline">
                    {constraint.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Scope:</span> {constraint.scope}
                </div>
                <div>
                  <span className="font-medium">Rule:</span> {constraint.constraintRule?.field} {constraint.constraintRule?.operator} {JSON.stringify(constraint.constraintRule?.value)}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {constraint.isActive ? "Active" : "Inactive"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Violations Management Component
function ViolationsManagement({ violations, constraints, queryClient, toast }: {
  violations: ConstraintViolation[];
  constraints: Constraint[];
  queryClient: any;
  toast: any;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Constraint Violations</h2>
          <p className="text-muted-foreground">Monitor and resolve constraint violations</p>
        </div>
      </div>

      <div className="space-y-4">
        {violations.map((violation) => (
          <Card key={violation.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{violation.impactDescription}</CardTitle>
                  <CardDescription>
                    {violation.violationEntityType} ID: {violation.violationEntityId}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge 
                    variant={violation.violationSeverity === 'critical' ? 'destructive' : 
                            violation.violationSeverity === 'major' ? 'default' : 'secondary'}
                  >
                    {violation.violationSeverity}
                  </Badge>
                  <Badge variant="outline">
                    {violation.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Expected:</span> {JSON.stringify(violation.expectedValue)}
                </div>
                <div>
                  <span className="font-medium">Actual:</span> {JSON.stringify(violation.violationValue)}
                </div>
              </div>
              {violation.status === 'open' && (
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    Resolve
                  </Button>
                  <Button size="sm" variant="outline">
                    Waive
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Constraints Monitoring Component
function ConstraintsMonitoring() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Constraints Monitoring</h2>
        <p className="text-muted-foreground">Real-time monitoring and alerts for constraint violations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Constraint Evaluation</CardTitle>
          <CardDescription>Test constraint evaluation against sample data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This section will contain real-time monitoring capabilities for constraint violations,
              including automatic evaluation triggers and alert systems.
            </p>
            <Button variant="outline">
              Configure Monitoring
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Bottleneck Analysis Component - Core TOC feature
function BottleneckAnalysis() {
  const { data: resources = [] } = useQuery({
    queryKey: ["/api/resources"],
  });

  const { data: operations = [] } = useQuery({
    queryKey: ["/api/operations"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bottleneck Analysis</h2>
        <p className="text-muted-foreground">Identify and analyze production constraints using Theory of Constraints</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Current Bottleneck
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Reactor 1 - Mixing Station</h3>
                <p className="text-sm text-muted-foreground">Capacity: 85% utilized</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Throughput Rate:</span>
                  <span className="font-medium">120 units/hour</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Queue Time:</span>
                  <span className="font-medium text-orange-600">4.5 hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impact on Output:</span>
                  <span className="font-medium text-red-600">-15%</span>
                </div>
              </div>
              <Button size="sm" className="w-full">
                View Exploitation Options
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Constraint Candidates</CardTitle>
            <CardDescription>Resources approaching constraint status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Packaging Line A</span>
                <Badge variant="outline" className="text-orange-600">78% utilized</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Quality Testing Lab</span>
                <Badge variant="outline" className="text-yellow-600">72% utilized</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Tablet Press 2</span>
                <Badge variant="outline">65% utilized</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Constraint Elevation</CardTitle>
            <CardDescription>Options to increase constraint capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add Shift Coverage
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Optimize Changeovers
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reduce Quality Defects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Utilization Heat Map</CardTitle>
          <CardDescription>Visual representation of resource constraints across the plant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: "Reactor 1", util: 85, color: "bg-red-500" },
              { name: "Reactor 2", util: 45, color: "bg-green-500" },
              { name: "Packaging A", util: 78, color: "bg-orange-500" },
              { name: "Packaging B", util: 52, color: "bg-green-500" },
              { name: "QC Lab", util: 72, color: "bg-yellow-500" },
              { name: "Tablet Press 1", util: 60, color: "bg-green-500" },
              { name: "Tablet Press 2", util: 65, color: "bg-yellow-500" },
              { name: "Warehouse", util: 40, color: "bg-green-500" }
            ].map((resource) => (
              <div key={resource.name} className="text-center">
                <div className={`h-20 ${resource.color} bg-opacity-80 rounded flex items-center justify-center text-white font-medium`}>
                  {resource.util}%
                </div>
                <p className="text-xs mt-1">{resource.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Buffer Management Component - Time and stock buffers before constraints
function BufferManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Buffer Management</h2>
        <p className="text-muted-foreground">Manage time and stock buffers to protect constraints and ensure flow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Buffers</CardTitle>
            <CardDescription>Protective time before constraint operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Constraint Buffer (Reactor 1)</span>
                    <span className="text-sm font-medium">2.5 hours</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">60% consumed - Healthy</p>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Shipping Buffer</span>
                    <span className="text-sm font-medium">4 hours</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">75% consumed - Monitor</p>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Assembly Buffer</span>
                    <span className="text-sm font-medium">1.5 hours</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">90% consumed - Critical</p>
                </div>
              </div>

              <Button size="sm" variant="outline" className="w-full">
                Adjust Buffer Sizes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Buffers</CardTitle>
            <CardDescription>Strategic inventory to protect constraint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Raw Material A</p>
                    <p className="text-xs text-muted-foreground">Target: 500 kg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">425 kg</p>
                    <Badge variant="outline" className="text-xs">85% of target</Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">WIP Before Constraint</p>
                    <p className="text-xs text-muted-foreground">Target: 200 units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">180 units</p>
                    <Badge variant="outline" className="text-xs">90% of target</Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Finished Goods Buffer</p>
                    <p className="text-xs text-muted-foreground">Target: 1000 units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">650 units</p>
                    <Badge variant="outline" className="text-xs text-orange-600">65% of target</Badge>
                  </div>
                </div>
              </div>

              <Button size="sm" className="w-full">
                Configure Buffer Policies
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buffer Penetration Alerts</CardTitle>
          <CardDescription>Real-time monitoring of buffer consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Assembly Buffer Critical</p>
                <p className="text-xs text-muted-foreground">90% consumed - Expedite feeding operations</p>
              </div>
              <Button size="sm" variant="outline">Take Action</Button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Shipping Buffer Warning</p>
                <p className="text-xs text-muted-foreground">75% consumed - Review upstream delays</p>
              </div>
              <Button size="sm" variant="outline">Investigate</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Drum-Buffer-Rope Scheduling Component
function DrumBufferRopeSchedule() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Drum-Buffer-Rope (DBR) Schedule</h2>
        <p className="text-muted-foreground">Synchronize production flow with the constraint rhythm</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              Drum (Constraint)
            </CardTitle>
            <CardDescription>Sets the pace for entire production</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Reactor 1 - Mixing Station</p>
                <p className="text-xs text-muted-foreground">Current pace: 120 units/hour</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily Capacity:</span>
                  <span className="font-medium">2,400 units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Scheduled Today:</span>
                  <span className="font-medium">2,350 units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Utilization:</span>
                  <span className="font-medium">97.9%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 bg-yellow-500 rounded-full" />
              Buffer
            </CardTitle>
            <CardDescription>Protection against variability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Constraint Buffer:</span>
                  <span className="font-medium">2.5 hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping Buffer:</span>
                  <span className="font-medium">4 hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Assembly Buffer:</span>
                  <span className="font-medium">1.5 hours</span>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full">
                Optimize Buffer Sizes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full" />
              Rope (Release)
            </CardTitle>
            <CardDescription>Material release schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Release Time:</span>
                  <span className="font-medium">Drum - 2.5h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Next Release:</span>
                  <span className="font-medium">14:30</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Release Quantity:</span>
                  <span className="font-medium">150 units</span>
                </div>
              </div>
              <Button size="sm" className="w-full">
                View Release Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>DBR Production Flow</CardTitle>
          <CardDescription>Visual representation of synchronized production flow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-32">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-gray-300"></div>
            </div>
            <div className="relative flex justify-between items-center h-full px-8">
              <div className="bg-green-500 text-white px-4 py-2 rounded">
                Material Release
              </div>
              <div className="bg-yellow-500 text-white px-4 py-2 rounded">
                Buffer Zone
              </div>
              <div className="bg-red-500 text-white px-4 py-2 rounded">
                Constraint (Drum)
              </div>
              <div className="bg-blue-500 text-white px-4 py-2 rounded">
                Shipping
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <p className="font-medium">T - 2.5h</p>
              <p className="text-xs text-muted-foreground">Release materials</p>
            </div>
            <div>
              <p className="font-medium">T - 1h to T</p>
              <p className="text-xs text-muted-foreground">Buffer protection</p>
            </div>
            <div>
              <p className="font-medium">T</p>
              <p className="text-xs text-muted-foreground">Process at constraint</p>
            </div>
            <div>
              <p className="font-medium">T + 4h</p>
              <p className="text-xs text-muted-foreground">Ship to customer</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Throughput Accounting Component
function ThroughputAccounting() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Throughput Accounting</h2>
        <p className="text-muted-foreground">Financial metrics focused on constraint optimization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Throughput ($T)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$125,000</p>
            <p className="text-xs text-muted-foreground">Sales - Truly Variable Costs</p>
            <p className="text-xs text-green-600 mt-1">+12% vs last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Operating Expense ($OE)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$85,000</p>
            <p className="text-xs text-muted-foreground">Fixed + overhead costs</p>
            <p className="text-xs text-red-600 mt-1">+3% vs last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Investment ($I)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$450,000</p>
            <p className="text-xs text-muted-foreground">Inventory + equipment</p>
            <p className="text-xs text-orange-600 mt-1">-5% vs last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$40,000</p>
            <p className="text-xs text-muted-foreground">$T - $OE</p>
            <p className="text-xs text-green-600 mt-1">+32% vs last period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Throughput per Constraint Hour</CardTitle>
            <CardDescription>Product profitability ranking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Product A - Premium</p>
                  <p className="text-xs text-muted-foreground">Constraint time: 0.5h/unit</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">$240/hour</p>
                  <Badge variant="outline" className="text-xs">Priority 1</Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Product C - Standard</p>
                  <p className="text-xs text-muted-foreground">Constraint time: 0.3h/unit</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">$180/hour</p>
                  <Badge variant="outline" className="text-xs">Priority 2</Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Product B - Basic</p>
                  <p className="text-xs text-muted-foreground">Constraint time: 0.8h/unit</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-orange-600">$95/hour</p>
                  <Badge variant="outline" className="text-xs">Priority 3</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Constraint Exploitation ROI</CardTitle>
            <CardDescription>Investment options to increase throughput</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium">Add Weekend Shift</p>
                  <Badge className="text-xs">320% ROI</Badge>
                </div>
                <div className="text-xs space-y-1">
                  <p>Investment: $5,000/week</p>
                  <p>Throughput gain: $16,000/week</p>
                </div>
              </div>

              <div className="p-3 border rounded">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium">Quick Changeover Kit</p>
                  <Badge className="text-xs">185% ROI</Badge>
                </div>
                <div className="text-xs space-y-1">
                  <p>Investment: $20,000 one-time</p>
                  <p>Throughput gain: $3,000/week</p>
                </div>
              </div>

              <div className="p-3 border rounded">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium">Quality Improvement</p>
                  <Badge className="text-xs">150% ROI</Badge>
                </div>
                <div className="text-xs space-y-1">
                  <p>Investment: $15,000</p>
                  <p>Throughput gain: $2,250/week</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}