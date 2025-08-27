import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, BookOpen, Edit, Trash2, Eye, User, Calendar, Tag, Filter, Menu, ArrowLeft, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MemoryBook, MemoryBookEntry, InsertMemoryBook, InsertMemoryBookEntry } from "@shared/schema";

const memoryBookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scope: z.enum(["global", "plant", "department", "project"]),
  plantId: z.number().optional(),
  departmentId: z.number().optional(),
  tags: z.array(z.string()).default([])
});

const memoryEntryFormSchema = z.object({
  memoryBookId: z.number(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  entryType: z.enum(["instruction", "procedure", "lesson_learned", "best_practice", "troubleshooting", "configuration"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  context: z.object({
    related_operations: z.array(z.string()).optional(),
    related_resources: z.array(z.string()).optional(),
    related_products: z.array(z.string()).optional(),
    situation_triggers: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional()
  }).optional()
});

type MemoryBookFormData = z.infer<typeof memoryBookFormSchema>;
type MemoryEntryFormData = z.infer<typeof memoryEntryFormSchema>;

export default function MemoryBookPage() {
  const [selectedBook, setSelectedBook] = useState<MemoryBook | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState("");
  const [createBookOpen, setCreateBookOpen] = useState(false);
  const [createEntryOpen, setCreateEntryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MemoryBookEntry | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch memory books
  const { data: memoryBooks = [], isLoading: booksLoading } = useQuery<MemoryBook[]>({
    queryKey: ["/api/memory-books"],
  });

  // Fetch entries for selected book
  const { data: entries = [], isLoading: entriesLoading } = useQuery<MemoryBookEntry[]>({
    queryKey: ["/api/memory-book-entries", selectedBook?.id, categoryFilter, searchTerm],
    enabled: !!selectedBook,
  });

  // Create memory book mutation
  const createBookMutation = useMutation({
    mutationFn: async (data: InsertMemoryBook) => {
      return apiRequest("/api/memory-books", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memory-books"] });
      setCreateBookOpen(false);
      toast({
        title: "Success",
        description: "Memory book created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create memory book",
        variant: "destructive",
      });
    },
  });

  // Create/update memory entry mutation
  const saveEntryMutation = useMutation({
    mutationFn: async (data: InsertMemoryBookEntry & { id?: number }) => {
      const url = data.id ? `/api/memory-book-entries/${data.id}` : "/api/memory-book-entries";
      const method = data.id ? "PUT" : "POST";
      const { id, ...payload } = data;
      return apiRequest(url, method, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memory-book-entries"] });
      setCreateEntryOpen(false);
      setEditingEntry(null);
      toast({
        title: "Success",
        description: editingEntry ? "Entry updated successfully" : "Entry created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${editingEntry ? "update" : "create"} entry`,
        variant: "destructive",
      });
    },
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/memory-book-entries/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memory-book-entries"] });
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    },
  });

  const bookForm = useForm<MemoryBookFormData>({
    resolver: zodResolver(memoryBookFormSchema),
    defaultValues: {
      title: "",
      description: "",
      scope: "global",
      tags: []
    }
  });

  const entryForm = useForm<MemoryEntryFormData>({
    resolver: zodResolver(memoryEntryFormSchema),
    defaultValues: {
      memoryBookId: selectedBook?.id || 0,
      title: "",
      content: "",
      entryType: "instruction",
      priority: "medium",
      category: "",
      tags: [],
      context: {}
    }
  });

  // Update form when editing entry
  useEffect(() => {
    if (editingEntry) {
      entryForm.reset({
        memoryBookId: editingEntry.memoryBookId,
        title: editingEntry.title,
        content: editingEntry.content,
        entryType: editingEntry.entryType as any,
        priority: editingEntry.priority as any,
        category: editingEntry.category || "",
        tags: editingEntry.tags || [],
        context: editingEntry.context || {}
      });
      setCreateEntryOpen(true);
    }
  }, [editingEntry, entryForm]);

  // Reset entry form when book changes
  useEffect(() => {
    if (selectedBook) {
      entryForm.setValue("memoryBookId", selectedBook.id);
    }
  }, [selectedBook, entryForm]);

  const onCreateBook = (data: MemoryBookFormData) => {
    const bookData: InsertMemoryBook = {
      ...data,
      createdBy: 4, // Use current user ID
      lastEditedBy: 4
    };
    createBookMutation.mutate(bookData);
  };

  const onSaveEntry = (data: MemoryEntryFormData) => {
    const entryData = {
      ...data,
      ...(editingEntry && { id: editingEntry.id }),
      createdBy: 1, // This should come from auth context
      lastEditedBy: 1,
      metadata: {
        ai_generated: false,
        source_type: "user_instruction" as const
      }
    };
    saveEntryMutation.mutate(entryData);
  };

  const handleEditEntry = (entry: MemoryBookEntry) => {
    setEditingEntry(entry);
  };

  const handleDeleteEntry = (entryId: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteEntryMutation.mutate(entryId);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || entry.category === categoryFilter;
    const matchesType = !entryTypeFilter || entryTypeFilter === 'all' || entry.entryType === entryTypeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const getEntryTypeColor = (type: string) => {
    const colors = {
      instruction: "bg-blue-100 text-blue-800",
      procedure: "bg-green-100 text-green-800",
      lesson_learned: "bg-yellow-100 text-yellow-800",
      best_practice: "bg-purple-100 text-purple-800",
      troubleshooting: "bg-red-100 text-red-800",
      configuration: "bg-gray-100 text-gray-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800"
    };
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Mobile sidebar component
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Memory Books
          </h1>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Dialog open={createBookOpen} onOpenChange={setCreateBookOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-1" />
              New Book
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Memory Book</DialogTitle>
              <DialogDescription>
                Create a new collaborative knowledge base for your team.
              </DialogDescription>
            </DialogHeader>
            <Form {...bookForm}>
              <form onSubmit={bookForm.handleSubmit(onCreateBook)} className="space-y-4">
                <FormField
                  control={bookForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter book title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bookForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter book description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bookForm.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scope</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scope" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          <SelectItem value="plant">Plant</SelectItem>
                          <SelectItem value="department">Department</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCreateBookOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBookMutation.isPending} className="w-full sm:w-auto">
                    {createBookMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {booksLoading ? (
          <div className="text-center py-8 text-gray-500">Loading books...</div>
        ) : memoryBooks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No memory books found</div>
        ) : (
          memoryBooks.map((book: MemoryBook) => (
            <Card
              key={book.id}
              className={`cursor-pointer transition-colors ${
                selectedBook?.id === book.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
              }`}
              onClick={() => {
                setSelectedBook(book);
                if (isMobile) setSidebarOpen(false);
              }}
            >
              <CardContent className="p-3">
                <div className="font-medium text-sm">{book.title}</div>
                {book.description && (
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{book.description}</div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {book.scope}
                  </Badge>
                  {book.tags && book.tags.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {book.tags.length} tags
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-80 bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content - Memory Entries */}
      <div className="flex-1 flex flex-col">
        {selectedBook ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-3 md:p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold truncate">{selectedBook.title}</h2>
                    {selectedBook.description && (
                      <p className="text-sm text-gray-600 hidden sm:block">{selectedBook.description}</p>
                    )}
                  </div>
                </div>
                <Dialog open={createEntryOpen} onOpenChange={(open) => {
                  setCreateEntryOpen(open);
                  if (!open) setEditingEntry(null);
                }}>
                  <DialogTrigger asChild>
                    <Button size={isMobile ? "sm" : "default"} className="shrink-0">
                      <Plus className="h-4 w-4 mr-1" />
                      {isMobile ? "Add" : "Add Entry"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
                    <DialogHeader>
                      <DialogTitle>
                        {editingEntry ? "Edit Entry" : "Add Memory Entry"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingEntry ? "Update this knowledge entry" : "Add new knowledge to the memory book"}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...entryForm}>
                      <form onSubmit={entryForm.handleSubmit(onSaveEntry)} className="space-y-4">
                        <FormField
                          control={entryForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter entry title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={entryForm.control}
                            name="entryType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Entry Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="instruction">Instruction</SelectItem>
                                    <SelectItem value="procedure">Procedure</SelectItem>
                                    <SelectItem value="lesson_learned">Lesson Learned</SelectItem>
                                    <SelectItem value="best_practice">Best Practice</SelectItem>
                                    <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                                    <SelectItem value="configuration">Configuration</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={entryForm.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={entryForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. scheduling, optimization, production" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={entryForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content (Markdown supported)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter the knowledge content..."
                                  className="min-h-[200px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setCreateEntryOpen(false);
                              setEditingEntry(null);
                            }}
                            className="w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={saveEntryMutation.isPending} className="w-full sm:w-auto">
                            {saveEntryMutation.isPending 
                              ? (editingEntry ? "Updating..." : "Creating...") 
                              : (editingEntry ? "Update" : "Create")
                            }
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-36">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="scheduling">Scheduling</SelectItem>
                      <SelectItem value="optimization">Optimization</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={entryTypeFilter} onValueChange={setEntryTypeFilter}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="instruction">Instruction</SelectItem>
                      <SelectItem value="procedure">Procedure</SelectItem>
                      <SelectItem value="lesson_learned">Lesson Learned</SelectItem>
                      <SelectItem value="best_practice">Best Practice</SelectItem>
                      <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                      <SelectItem value="configuration">Configuration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4">
              {entriesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading entries...</div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No entries found. {searchTerm || categoryFilter || entryTypeFilter ? "Try adjusting your filters." : "Add your first entry to get started."}
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {filteredEntries.map((entry: MemoryBookEntry) => (
                    <Card key={entry.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base leading-tight">{entry.title}</CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge className={getEntryTypeColor(entry.entryType)}>
                                {entry.entryType.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(entry.priority)}>
                                {entry.priority}
                              </Badge>
                              {entry.category && (
                                <Badge variant="outline">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {entry.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditEntry(entry)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                            {isMobile ? entry.content.substring(0, 150) : entry.content.substring(0, 300)}
                            {entry.content.length > (isMobile ? 150 : 300) && "..."}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="hidden sm:inline">Created by</span> User {entry.createdBy}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </div>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {isMobile 
                                ? `${entry.tags.length} tag${entry.tags.length > 1 ? 's' : ''}`
                                : `${entry.tags.slice(0, 2).join(", ")}${entry.tags.length > 2 ? ` +${entry.tags.length - 2} more` : ''}`
                              }
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              {isMobile && (
                <Button
                  variant="outline"
                  onClick={() => setSidebarOpen(true)}
                  className="mb-6"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Browse Memory Books
                </Button>
              )}
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Memory Book</h3>
              <p className="text-gray-600 text-center max-w-sm">
                {isMobile 
                  ? "Tap 'Browse Memory Books' to choose a memory book and view its knowledge entries."
                  : "Choose a memory book from the sidebar to view and manage its knowledge entries."
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}