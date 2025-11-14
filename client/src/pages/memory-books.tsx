import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Sparkles, FileText, Clock, Users, Target, Bot, Edit, BookTemplate } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertPlaybookSchema } from "@shared/schema";
import type { Playbook, InsertPlaybook } from "@shared/schema";
import { z } from "zod";
import { INDUSTRY_TEMPLATES, type PlaybookTemplate } from "@/config/playbook-templates";

const AI_AGENTS = [
  { id: 'max', name: 'Max AI', description: 'System orchestrator and production intelligence' },
  { id: 'production_scheduling', name: 'Production Scheduling Agent', description: 'Schedule optimization and resource allocation' },
  { id: 'shop_floor', name: 'Shop Floor Agent', description: 'Real-time monitoring and event response' },
  { id: 'quality_management', name: 'Quality Management Agent', description: 'Quality control and compliance' },
  { id: 'demand_management', name: 'Demand Management Agent', description: 'Demand forecasting and planning' },
  { id: 'supply_plan', name: 'Supply Planning Agent', description: 'Supply planning and procurement' },
  { id: 'inventory_planning', name: 'Inventory Planning Agent', description: 'Inventory optimization' },
  { id: 'predictive_maintenance', name: 'Predictive Maintenance Agent', description: 'Equipment health and maintenance' },
];

export default function MemoryBooksPage() {
  const [selectedBook, setSelectedBook] = useState<Playbook | null>(null);
  const [createBookOpen, setCreateBookOpen] = useState(false);
  const [editBookOpen, setEditBookOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [appliedTemplate, setAppliedTemplate] = useState<PlaybookTemplate | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch playbooks
  const { data: allPlaybooks = [], isLoading: booksLoading } = useQuery<Playbook[]>({
    queryKey: ["/api/playbooks"],
    retry: false,
  });

  // Group playbooks by agent
  const playbooksByAgent = AI_AGENTS.map(agent => ({
    agent,
    playbooks: allPlaybooks.filter((book: Playbook) => book.agentId === agent.id)
  })).filter(group => group.playbooks.length > 0); // Only show agents that have playbooks

  // Form validation schema
  const formSchema = insertPlaybookSchema.extend({
    agentId: z.string().min(1, "Please select an agent"),
  }).omit({ createdBy: true, isActive: true, tags: true });

  // Form instance for creating
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      agentId: "",
      category: "",
    },
  });

  // Form instance for editing
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      agentId: "",
      category: "",
    },
  });

  // Create playbook mutation
  const createBookMutation = useMutation({
    mutationFn: async (data: InsertPlaybook) => {
      return await apiRequest("/api/playbooks", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playbooks"] });
      setCreateBookOpen(false);
      form.reset();
      setAppliedTemplate(null); // Clear applied template state
      toast({
        title: "Success",
        description: "Playbook created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create playbook",
        variant: "destructive",
      });
    },
  });

  const handleCreateBook = (values: z.infer<typeof formSchema>) => {
    const bookData: InsertPlaybook = {
      ...values,
      tags: [],
      createdBy: 1,
    };
    createBookMutation.mutate(bookData);
  };

  const handleApplyTemplate = (template: PlaybookTemplate) => {
    form.reset({
      title: template.title,
      description: template.description,
      content: template.content,
      agentId: template.agentId,
      category: template.category,
    });
    setAppliedTemplate(template);
    setTemplatePickerOpen(false);
    toast({
      title: "Template Applied",
      description: `"${template.title}" template has been applied. You can edit before creating.`,
    });
  };

  // Update playbook mutation
  const updateBookMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<InsertPlaybook> }) => {
      return await apiRequest(`/api/playbooks/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playbooks"] });
      setEditBookOpen(false);
      setSelectedBook(null);
      toast({
        title: "Success",
        description: "Playbook updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update playbook",
        variant: "destructive",
      });
    },
  });

  const handleEditBook = (values: z.infer<typeof formSchema>) => {
    if (!selectedBook) return;
    updateBookMutation.mutate({
      id: selectedBook.id,
      updates: values,
    });
  };

  const openEditDialog = (book: Playbook) => {
    setSelectedBook(book);
    editForm.reset({
      title: book.title,
      description: book.description || "",
      content: book.content,
      agentId: book.agentId,
      category: book.category || "",
    });
    setEditBookOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="h-8 w-8 text-purple-600" />
            AI Agent Playbooks
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Knowledge base for AI agents - store instructions, best practices, and learned insights
          </p>
        </div>
        
        <div>
          <Dialog 
            open={createBookOpen} 
            onOpenChange={(open) => {
              setCreateBookOpen(open);
              if (!open) {
                // Clear applied template when dialog is closed
                setAppliedTemplate(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button data-testid="button-create-playbook">
                <Plus className="h-4 w-4 mr-2" />
                Create Playbook
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Playbook</DialogTitle>
            </DialogHeader>

            {/* Template Selection Banner */}
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <BookTemplate className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                    {appliedTemplate ? `Template: ${appliedTemplate.title}` : "Start from a template"}
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    {appliedTemplate ? "You can still edit before creating" : "Choose from industry-specific templates"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTemplatePickerOpen(true)}
                className="border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300"
                data-testid="button-choose-template"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {appliedTemplate ? "Change" : "Choose Template"}
              </Button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateBook)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Scheduling Best Practices" {...field} data-testid="input-title" />
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
                        <Textarea placeholder="Brief summary of this playbook..." {...field} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Agent</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-agent">
                            <SelectValue placeholder="Select an agent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AI_AGENTS.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
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
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the playbook instructions, rules, and guidelines..." 
                          className="min-h-[200px]" 
                          {...field} 
                          data-testid="input-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Scheduling, Quality, Planning" {...field} data-testid="input-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createBookMutation.isPending} data-testid="button-submit">
                  {createBookMutation.isPending ? "Creating..." : "Create Playbook"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Playbooks List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Playbooks by Agent</CardTitle>
              <CardDescription>Organized by AI agent - select a playbook to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {booksLoading ? (
                  <div className="text-sm text-gray-500">Loading playbooks...</div>
                ) : playbooksByAgent.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No playbooks found. Create your first playbook to get started!
                  </div>
                ) : (
                  playbooksByAgent.map(({ agent, playbooks }) => (
                    <div key={agent.id} className="space-y-2">
                      {/* Agent Header */}
                      <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-md border-l-4 border-purple-500">
                        <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <div>
                          <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-200">{agent.name}</h3>
                          <p className="text-xs text-purple-700 dark:text-purple-300">{playbooks.length} playbook{playbooks.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      
                      {/* Playbooks for this agent */}
                      {playbooks.map((book: Playbook) => (
                        <div
                          key={book.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ml-4 ${
                            selectedBook?.id === book.id
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                              : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                          }`}
                          onClick={() => setSelectedBook(book)}
                          data-testid={`playbook-item-${book.id}`}
                        >
                          <div className="font-medium text-sm">{book.title}</div>
                          {book.description && (
                            <div className="text-xs text-gray-500 mt-1">{book.description}</div>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {book.category && (
                              <Badge variant="outline" className="text-xs">
                                {book.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Playbook Content */}
        <div className="lg:col-span-2">
          {selectedBook ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{selectedBook.title}</CardTitle>
                    {selectedBook.description && (
                      <CardDescription>{selectedBook.description}</CardDescription>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(selectedBook)}
                    data-testid="button-edit-playbook"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {selectedBook.agentId && (
                    <Badge variant="default" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      <Bot className="h-3 w-3 mr-1" />
                      {AI_AGENTS.find(a => a.id === selectedBook.agentId)?.name}
                    </Badge>
                  )}
                  {selectedBook.category && (
                    <Badge variant="outline">
                      {selectedBook.category}
                    </Badge>
                  )}
                  {selectedBook.createdAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      Created {new Date(selectedBook.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Playbook Content
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
{selectedBook.content}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-500">Select a playbook to view its content</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editBookOpen} onOpenChange={setEditBookOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Playbook</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditBook)} className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Playbook title" {...field} data-testid="input-edit-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description" {...field} data-testid="input-edit-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="agentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-agent">
                            <SelectValue placeholder="Select an agent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AI_AGENTS.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the playbook instructions, rules, and guidelines..." 
                          className="min-h-[400px] font-mono text-sm" 
                          {...field} 
                          data-testid="input-edit-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Scheduling, Quality, Planning" {...field} data-testid="input-edit-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditBookOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateBookMutation.isPending} data-testid="button-save-edit">
                  {updateBookMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Template Picker Dialog */}
      <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Choose Industry Template
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select a template from specific manufacturing industries to get started quickly
            </p>
          </DialogHeader>

          <Tabs defaultValue={INDUSTRY_TEMPLATES[0].id} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              {INDUSTRY_TEMPLATES.map((industry) => (
                <TabsTrigger
                  key={industry.id}
                  value={industry.id}
                  className="flex-shrink-0"
                  data-testid={`tab-${industry.id}`}
                >
                  {industry.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {INDUSTRY_TEMPLATES.map((industry) => (
              <TabsContent
                key={industry.id}
                value={industry.id}
                className="flex-1 overflow-y-auto mt-4"
              >
                <div className="mb-3 pb-2 border-b">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {industry.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {industry.templates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
                      onClick={() => handleApplyTemplate(template)}
                      data-testid={`template-card-${template.id}`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-start justify-between">
                          <span className="flex-1">{template.title}</span>
                          <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs">
                            {template.category}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {template.scenario}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Bot className="h-3 w-3" />
                            <span>
                              {AI_AGENTS.find(a => a.id === template.agentId)?.name || template.agentId}
                            </span>
                          </div>
                          
                          {template.useCases && template.useCases.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Use Cases:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {template.useCases.slice(0, 3).map((useCase, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs px-2 py-0"
                                  >
                                    {useCase}
                                  </Badge>
                                ))}
                                {template.useCases.length > 3 && (
                                  <Badge variant="secondary" className="text-xs px-2 py-0">
                                    +{template.useCases.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyTemplate(template);
                            }}
                            data-testid={`button-apply-${template.id}`}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Apply Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}