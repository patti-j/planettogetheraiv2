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
import { Search, Plus, Sparkles, FileText, Clock, Users, Target, Bot } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Playbook, InsertPlaybook } from "@shared/schema";

const AI_AGENTS = [
  { id: 'max', name: 'Max AI', description: 'Production intelligence and optimization' },
  { id: 'scheduler', name: 'Scheduler Agent', description: 'Scheduling and resource allocation' },
  { id: 'quality', name: 'Quality Agent', description: 'Quality control and compliance' },
  { id: 'planner', name: 'Planner Agent', description: 'Demand planning and forecasting' },
];

export default function MemoryBooksPage() {
  const [selectedBook, setSelectedBook] = useState<Playbook | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [createBookOpen, setCreateBookOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch playbooks
  const { data: allPlaybooks = [], isLoading: booksLoading } = useQuery<Playbook[]>({
    queryKey: ["/api/playbooks"],
    retry: false,
  });

  // Filter playbooks by agent
  const playbooks = selectedAgent === "all" 
    ? allPlaybooks 
    : allPlaybooks.filter((book: Playbook) => book.agentId === selectedAgent);

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

  const handleCreateBook = (formData: FormData) => {
    const bookData: InsertPlaybook = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      content: formData.get("content") as string,
      agentId: formData.get("agentId") as string || undefined,
      category: formData.get("category") as string || undefined,
      tags: [],
      createdBy: 1,
    };
    createBookMutation.mutate(bookData);
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
        
        <div className="flex items-center gap-3">
          <div className="w-56">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {AI_AGENTS.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        
        <Dialog open={createBookOpen} onOpenChange={setCreateBookOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Playbook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Playbook</DialogTitle>
            </DialogHeader>
            <form action={handleCreateBook}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="e.g., Scheduling Best Practices" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Brief summary of this playbook..." />
                </div>
                <div>
                  <Label htmlFor="agentId">AI Agent</Label>
                  <Select name="agentId" required>
                    <SelectTrigger id="agentId">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_AGENTS.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea 
                    id="content" 
                    name="content" 
                    placeholder="Enter the playbook instructions, rules, and guidelines..." 
                    className="min-h-[200px]" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" placeholder="e.g., Scheduling, Quality, Planning" />
                </div>
                <Button type="submit" disabled={createBookMutation.isPending}>
                  {createBookMutation.isPending ? "Creating..." : "Create Playbook"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
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
                ) : playbooks.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    {selectedAgent === "all" ? "No playbooks found" : `No playbooks for ${AI_AGENTS.find(a => a.id === selectedAgent)?.name}`}
                  </div>
                ) : (
                  playbooks.map((book: Playbook) => {
                    const agent = AI_AGENTS.find(a => a.id === book.agentId);
                    return (
                      <div
                        key={book.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
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
                          {agent && (
                            <Badge variant="default" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                              <Bot className="h-3 w-3 mr-1" />
                              {agent.name}
                            </Badge>
                          )}
                          {book.category && (
                            <Badge variant="outline" className="text-xs">
                              {book.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
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
    </div>
  );
}