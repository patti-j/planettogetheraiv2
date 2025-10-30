import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Sparkles, FileText, Clock, Users, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MemoryBook, MemoryBookEntry, InsertMemoryBook, InsertMemoryBookEntry } from "@shared/schema";

export default function MemoryBooksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBook, setSelectedBook] = useState<MemoryBook | null>(null);
  const [createBookOpen, setCreateBookOpen] = useState(false);
  const [createEntryOpen, setCreateEntryOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch memory books
  const { data: memoryBooks = [], isLoading: booksLoading } = useQuery({
    queryKey: ["/api/memory-books"],
    retry: false,
  });

  // Fetch memory book entries
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/memory-book-entries", selectedBook?.id],
    enabled: !!selectedBook,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBook?.id) {
        params.append("memoryBookId", selectedBook.id.toString());
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      return await apiRequest(`/api/memory-book-entries?${params.toString()}`);
    },
  });

  // Create memory book mutation
  const createBookMutation = useMutation({
    mutationFn: async (data: InsertMemoryBook) => {
      return await apiRequest("/api/memory-books", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memory-books"] });
      setCreateBookOpen(false);
      toast({
        title: "Success",
        description: "Memory book created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create memory book",
        variant: "destructive",
      });
    },
  });

  // Create memory book entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: InsertMemoryBookEntry) => {
      return await apiRequest("/api/memory-book-entries", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memory-book-entries"] });
      setCreateEntryOpen(false);
      toast({
        title: "Success",
        description: "Memory entry created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create memory entry",
        variant: "destructive",
      });
    },
  });

  const handleCreateBook = (formData: FormData) => {
    const bookData: InsertMemoryBook = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      scope: formData.get("scope") as string,
      createdBy: 1, // Using demo user for now
    };
    createBookMutation.mutate(bookData);
  };

  const handleCreateEntry = (formData: FormData) => {
    if (!selectedBook) return;
    
    const entryData: InsertMemoryBookEntry = {
      memoryBookId: selectedBook.id,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      entryType: formData.get("entryType") as string,
      priority: formData.get("priority") as string,
      category: formData.get("category") as string,
      createdBy: 1, // Using demo user for now
    };
    createEntryMutation.mutate(entryData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            Max AI Memory Books
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Collaborative knowledge base for storing user instructions and AI learnings
          </p>
        </div>
        
        <Dialog open={createBookOpen} onOpenChange={setCreateBookOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Memory Book
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Memory Book</DialogTitle>
            </DialogHeader>
            <form action={handleCreateBook}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="e.g., Scheduling Best Practices" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Describe what this memory book contains..." />
                </div>
                <div>
                  <Label htmlFor="scope">Scope</Label>
                  <Select name="scope" defaultValue="global">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="plant">Plant</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={createBookMutation.isPending}>
                  {createBookMutation.isPending ? "Creating..." : "Create Playbook"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Playbooks List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Playbooks</CardTitle>
              <CardDescription>Select a playbook to view its entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {booksLoading ? (
                  <div className="text-sm text-gray-500">Loading playbooks...</div>
                ) : memoryBooks.length === 0 ? (
                  <div className="text-sm text-gray-500">No playbooks found</div>
                ) : (
                  memoryBooks.map((book: MemoryBook) => (
                    <div
                      key={book.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedBook?.id === book.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                      }`}
                      onClick={() => setSelectedBook(book)}
                    >
                      <div className="font-medium text-sm">{book.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{book.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {book.scope}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Playbook Entries */}
        <div className="lg:col-span-2">
          {selectedBook ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedBook.title}</CardTitle>
                    <CardDescription>{selectedBook.description}</CardDescription>
                  </div>
                  <Dialog open={createEntryOpen} onOpenChange={setCreateEntryOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Playbook Entry</DialogTitle>
                      </DialogHeader>
                      <form action={handleCreateEntry}>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" placeholder="e.g., How to handle bottlenecks" required />
                          </div>
                          <div>
                            <Label htmlFor="content">Content</Label>
                            <Textarea 
                              id="content" 
                              name="content" 
                              placeholder="Detailed instructions, lessons learned, or best practices..." 
                              rows={6}
                              required 
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="entryType">Type</Label>
                              <Select name="entryType" defaultValue="instruction">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="instruction">Instruction</SelectItem>
                                  <SelectItem value="procedure">Procedure</SelectItem>
                                  <SelectItem value="lesson_learned">Lesson Learned</SelectItem>
                                  <SelectItem value="best_practice">Best Practice</SelectItem>
                                  <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                                  <SelectItem value="configuration">Configuration</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="priority">Priority</Label>
                              <Select name="priority" defaultValue="medium">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="category">Category</Label>
                              <Input id="category" name="category" placeholder="e.g., scheduling" />
                            </div>
                          </div>
                          <Button type="submit" disabled={createEntryMutation.isPending}>
                            {createEntryMutation.isPending ? "Creating..." : "Create Entry"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entriesLoading ? (
                    <div className="text-sm text-gray-500">Loading entries...</div>
                  ) : entries.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="text-sm text-gray-500">No entries found</div>
                      <div className="text-xs text-gray-400">Create your first memory entry to get started</div>
                    </div>
                  ) : (
                    entries.map((entry: MemoryBookEntry) => (
                      <Card key={entry.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm">{entry.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {entry.entryType}
                              </Badge>
                              <Badge 
                                variant={entry.priority === 'critical' ? 'destructive' : 
                                        entry.priority === 'high' ? 'default' : 'outline'} 
                                className="text-xs"
                              >
                                {entry.priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {entry.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </div>
                            {entry.category && (
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {entry.category}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-500">Select a memory book to view its entries</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}