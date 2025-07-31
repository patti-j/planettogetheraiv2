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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
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

        <TabsContent value="categories">
          <ConstraintCategories 
            categories={constraintCategories}
            queryClient={queryClient}
            toast={toast}
          />
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