import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings, Sparkles, Cloud, Server, Shield, AlertCircle, 
  CheckCircle2, XCircle, RefreshCw, Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const providerFormSchema = z.object({
  providerType: z.enum(["openai", "ollama", "custom"]),
  providerName: z.string().min(1, "Provider name is required"),
  defaultModel: z.string().min(1, "Default model is required"),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(100000).default(4000),
  allowDataSharing: z.boolean().default(false),
});

type ProviderForm = z.infer<typeof providerFormSchema>;

export default function LLMSettings() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch LLM providers
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['/api/llm-providers']
  });

  // Fetch active provider
  const { data: activeProvider } = useQuery({
    queryKey: ['/api/llm-providers/active']
  });

  // Create provider mutation
  const createProviderMutation = useMutation({
    mutationFn: (data: ProviderForm) => apiRequest('/api/llm-providers', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        configuration: {
          apiKey: data.apiKey || undefined,
          baseUrl: data.baseUrl || undefined,
        },
        isActive: false,
        isDefault: false,
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/llm-providers'] });
      setIsDialogOpen(false);
      toast({
        title: "Provider Created",
        description: "LLM provider has been created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create provider",
        variant: "destructive"
      });
    }
  });

  // Activate provider mutation
  const activateProviderMutation = useMutation({
    mutationFn: (providerId: number) => apiRequest(`/api/llm-providers/${providerId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: true })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/llm-providers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/llm-providers/active'] });
      toast({
        title: "Provider Activated",
        description: "LLM provider has been activated"
      });
    }
  });

  const form = useForm<ProviderForm>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      providerType: "ollama",
      providerName: "",
      defaultModel: "llama2",
      temperature: 0.7,
      maxTokens: 4000,
      allowDataSharing: false,
    }
  });

  const onSubmit = (data: ProviderForm) => {
    createProviderMutation.mutate(data);
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'openai':
        return <Cloud className="h-5 w-5" />;
      case 'ollama':
        return <Server className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            LLM Provider Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure AI language model providers - choose between cloud and local options
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add LLM Provider</DialogTitle>
              <DialogDescription>
                Configure a new language model provider
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="providerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ollama">Ollama (Local - Privacy-First)</SelectItem>
                          <SelectItem value="openai">OpenAI (Cloud)</SelectItem>
                          <SelectItem value="custom">Custom API</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Local providers keep your data private
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="providerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Local LLM" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Model</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={form.watch("providerType") === "ollama" ? "llama2" : "gpt-4o"} 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch("providerType") === "ollama" 
                          ? "Examples: llama2, mistral, codellama" 
                          : "Examples: gpt-4o, gpt-4o-mini"}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {form.watch("providerType") === "ollama" && (
                  <FormField
                    control={form.control}
                    name="baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base URL</FormLabel>
                        <FormControl>
                          <Input placeholder="http://localhost:11434" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL where Ollama is running
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("providerType") === "openai" && (
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="sk-..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxTokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tokens</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="allowDataSharing"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Data Sharing</FormLabel>
                        <FormDescription>
                          Share data with external AI provider for improvement
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProviderMutation.isPending}>
                    {createProviderMutation.isPending ? "Creating..." : "Create Provider"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Privacy:</strong> Local LLM providers (like Ollama) keep your data completely private - 
          no information is sent to external servers. Cloud providers may process your data on their servers.
        </AlertDescription>
      </Alert>

      {/* Active Provider */}
      {activeProvider && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getProviderIcon(activeProvider.providerType)}
                <CardTitle>Active Provider</CardTitle>
              </div>
              <Badge className="bg-green-600">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="font-medium">{activeProvider.providerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{activeProvider.providerType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Model:</span>
                <span className="font-medium">{activeProvider.defaultModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Data Sharing:</span>
                <span className="font-medium">
                  {activeProvider.allowDataSharing ? (
                    <Badge variant="outline" className="text-yellow-600">Enabled</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600">Disabled</Badge>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Providers</CardTitle>
          <CardDescription>
            Manage your configured LLM providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {providersLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : providers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No providers configured. Add a provider to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {providers.map((provider: any) => (
                <div key={provider.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getProviderIcon(provider.providerType)}
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {provider.providerName}
                        {provider.isActive && (
                          <Badge variant="outline" className="text-green-600">Active</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {provider.providerType} • {provider.defaultModel}
                      </div>
                    </div>
                  </div>
                  {!provider.isActive && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => activateProviderMutation.mutate(provider.id)}
                      disabled={activateProviderMutation.isPending}
                    >
                      Activate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
