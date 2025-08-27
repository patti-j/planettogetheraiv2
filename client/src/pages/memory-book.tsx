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
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, BookOpen, Edit, Trash2, User, Calendar, Tag, Menu, X, Save, FileText, Brain } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MemoryBook } from "@shared/schema";

const memoryBookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string()).default([])
});

type MemoryBookFormData = z.infer<typeof memoryBookFormSchema>;

export default function MemoryBookPage() {
  const [selectedBook, setSelectedBook] = useState<MemoryBook | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [createBookOpen, setCreateBookOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<MemoryBook | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
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

  // Fetch Max AI memories
  const { data: maxAIMemories = [], isLoading: maxMemoriesLoading } = useQuery<any[]>({
    queryKey: ["/api/max-ai/memories"],
    select: (data: any) => data.memories || []
  });

  // Create/update memory book mutation
  const saveBookMutation = useMutation({
    mutationFn: async (data: MemoryBookFormData & { id?: number }) => {
      const url = data.id ? `/api/memory-books/${data.id}` : "/api/memory-books";
      const method = data.id ? "PUT" : "POST";
      const { id, ...payload } = data;
      const bookData = {
        ...payload,
        createdBy: 4,
        lastEditedBy: 4
      };
      return apiRequest(url, method, bookData);
    },
    onSuccess: (newBook) => {
      queryClient.invalidateQueries({ queryKey: ["/api/memory-books"] });
      setCreateBookOpen(false);
      setEditingBook(null);
      setIsEditing(false);
      if (!editingBook && newBook && typeof newBook === 'object' && 'id' in newBook) {
        setSelectedBook(newBook as MemoryBook);
      }
      toast({
        title: "Success",
        description: editingBook ? "Memory book updated successfully" : "Memory book created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${editingBook ? "update" : "create"} memory book`,
        variant: "destructive",
      });
    },
  });

  // Delete memory book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/memory-books/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memory-books"] });
      setSelectedBook(null);
      toast({
        title: "Success",
        description: "Memory book deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete memory book",
        variant: "destructive",
      });
    },
  });

  const bookForm = useForm<MemoryBookFormData>({
    resolver: zodResolver(memoryBookFormSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: []
    }
  });

  // Update form when editing book
  useEffect(() => {
    if (editingBook) {
      bookForm.reset({
        title: editingBook.title,
        content: editingBook.content || "",
        tags: editingBook.tags || []
      });
      setCreateBookOpen(true);
    }
  }, [editingBook, bookForm]);

  const onSaveBook = (data: MemoryBookFormData) => {
    const bookData = {
      ...data,
      ...(editingBook && { id: editingBook.id })
    };
    saveBookMutation.mutate(bookData);
  };

  const handleEditBook = (book: MemoryBook) => {
    setEditingBook(book);
  };

  const handleDeleteBook = (bookId: number) => {
    if (confirm("Are you sure you want to delete this memory book? This action cannot be undone.")) {
      deleteBookMutation.mutate(bookId);
    }
  };

  const startEditing = () => {
    if (selectedBook) {
      bookForm.reset({
        title: selectedBook.title,
        content: selectedBook.content || "",
        tags: selectedBook.tags || []
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    bookForm.reset();
  };

  const saveDirectEdit = () => {
    if (selectedBook) {
      const formData = bookForm.getValues();
      saveBookMutation.mutate({
        ...formData,
        id: selectedBook.id
      });
    }
  };

  const filteredBooks = memoryBooks.filter(book => {
    const matchesSearch = !searchTerm || 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.content || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !tagFilter || tagFilter === 'all' || 
      (book.tags && book.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())));
    
    return matchesSearch && matchesTag;
  });

  const filteredAIMemories = maxAIMemories.filter((memory: any) => {
    const matchesSearch = !searchTerm || 
      memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (memory.content || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !tagFilter || tagFilter === 'all' || 
      (memory.tags && memory.tags.some((tag: string) => tag.toLowerCase().includes(tagFilter.toLowerCase())));
    
    return matchesSearch && matchesTag;
  });

  const currentData = activeTab === 'manual' ? filteredBooks : filteredAIMemories;
  const isLoading = activeTab === 'manual' ? booksLoading : maxMemoriesLoading;

  // Get all unique tags from all books and memories
  const allTags = Array.from(new Set([
    ...memoryBooks.flatMap(book => book.tags || []),
    ...maxAIMemories.flatMap((memory: any) => memory.tags || [])
  ])).sort();

  const addTag = () => {
    if (newTag.trim()) {
      const currentTags = bookForm.getValues("tags");
      if (!currentTags.includes(newTag.trim())) {
        bookForm.setValue("tags", [...currentTags, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = bookForm.getValues("tags");
    bookForm.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
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
        
        {/* Tab Selector */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
          <Button
            variant={activeTab === 'manual' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 h-8"
            onClick={() => setActiveTab('manual')}
          >
            <FileText className="h-3 w-3 mr-1" />
            Manual
          </Button>
          <Button
            variant={activeTab === 'ai' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 h-8"
            onClick={() => setActiveTab('ai')}
          >
            <Brain className="h-3 w-3 mr-1" />
            Max AI
          </Button>
        </div>
        {activeTab === 'manual' && (
          <Dialog open={createBookOpen} onOpenChange={setCreateBookOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1" />
                New Memory Book
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBook ? "Edit Memory Book" : "Create Memory Book"}</DialogTitle>
              <DialogDescription>
                Create a free-form knowledge base for your team. Use tags to organize content.
              </DialogDescription>
            </DialogHeader>
            <Form {...bookForm}>
              <form onSubmit={bookForm.handleSubmit(onSaveBook)} className="space-y-4">
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
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Write your content here... Supports markdown formatting. Use tags to organize and link related content."
                          className="min-h-[300px] font-mono text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {bookForm.watch("tags").map((tag, index) => (
                      <Badge key={index} variant="secondary" className="px-2 py-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-xs hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag (e.g., plant-1, manufacturing, procedures)"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setCreateBookOpen(false);
                      setEditingBook(null);
                    }} 
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveBookMutation.isPending} className="w-full sm:w-auto">
                    {saveBookMutation.isPending ? "Saving..." : (editingBook ? "Update" : "Create")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>
      
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading {activeTab === 'manual' ? 'books' : 'AI memories'}...
          </div>
        ) : currentData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {activeTab === 'manual' ? 'No memory books found' : 'No AI memories found'}
            {activeTab === 'ai' && (
              <p className="text-sm mt-2">AI memories are automatically created when Max AI detects important preferences or instructions in your conversations.</p>
            )}
          </div>
        ) : (
          currentData.map((item: any) => (
            <Card
              key={item.id}
              className={`cursor-pointer transition-colors ${
                selectedBook?.id === item.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
              }`}
              onClick={() => {
                setSelectedBook(item);
                if (isMobile) setSidebarOpen(false);
              }}
            >
              <CardContent className="p-3">
                <div className="font-medium text-sm mb-1">{book.title}</div>
                <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {(book.content || "").substring(0, 100)}...
                </div>
                <div className="flex items-center gap-2">
                  {book.tags && book.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {book.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {book.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{book.tags.length - 3}
                        </Badge>
                      )}
                    </div>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedBook ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
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
                  <h1 className="text-xl font-semibold truncate">{selectedBook.title}</h1>
                </div>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={startEditing}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditBook(selectedBook)}>
                        <FileText className="h-4 w-4 mr-1" />
                        Edit Meta
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteBook(selectedBook.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={cancelEditing}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveDirectEdit} disabled={saveBookMutation.isPending}>
                        <Save className="h-4 w-4 mr-1" />
                        {saveBookMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Tags */}
              {selectedBook.tags && selectedBook.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedBook.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Created by User {selectedBook.createdBy}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedBook.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isEditing ? (
                <Form {...bookForm}>
                  <div className="space-y-4">
                    <FormField
                      control={bookForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              {...field}
                              className="min-h-[500px] font-mono text-sm resize-none border-none shadow-none focus:ring-0 p-0"
                              placeholder="Start writing your content here..."
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              ) : (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {selectedBook.content || "No content yet. Click Edit to add content."}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              {isMobile && (
                <Button
                  variant="outline"
                  className="mb-4"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Browse Memory Books
                </Button>
              )}
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Memory Book</h3>
              <p className="text-gray-600">
                Choose a memory book from the sidebar to view and edit its content
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}