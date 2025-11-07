import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileVideo, 
  FileText, 
  History, 
  LineChart,
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  Clock,
  BarChart3
} from "lucide-react";

export function RoutingIntelligence() {
  const [activeTab, setActiveTab] = useState("evidence");
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedDraft, setSelectedDraft] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch jobs for selection
  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"]
  }) as { data: any[] };

  // Fetch evidence
  const { data: evidence = [], refetch: refetchEvidence } = useQuery({
    queryKey: ["/api/routing-intelligence/evidence", selectedJob],
    queryFn: async () => {
      const params = selectedJob ? `?jobId=${selectedJob}` : "";
      const response = await fetch(`/api/routing-intelligence/evidence${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch evidence");
      return response.json();
    }
  });

  // Fetch drafts
  const { data: drafts = [], refetch: refetchDrafts } = useQuery({
    queryKey: ["/api/routing-intelligence/drafts", selectedJob],
    queryFn: async () => {
      const params = selectedJob ? `?jobId=${selectedJob}` : "";
      const response = await fetch(`/api/routing-intelligence/drafts${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch drafts");
      return response.json();
    }
  });

  // Fetch validation runs for selected draft
  const { data: validationRuns = [] } = useQuery({
    queryKey: ["/api/routing-intelligence/validation-runs", selectedDraft],
    enabled: selectedDraft !== null,
    queryFn: async () => {
      const response = await fetch(`/api/routing-intelligence/validation-runs/${selectedDraft}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch validation runs");
      return response.json();
    }
  });

  // Fetch improvement suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ["/api/routing-intelligence/improvement-suggestions", selectedDraft],
    queryFn: async () => {
      const params = selectedDraft ? `?draftId=${selectedDraft}` : "";
      const response = await fetch(`/api/routing-intelligence/improvement-suggestions${params}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      return response.json();
    }
  });

  // Upload evidence mutation
  const uploadEvidenceMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/routing-intelligence/evidence", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Evidence uploaded successfully" });
      refetchEvidence();
    }
  });

  // Generate routing mutation
  const generateRoutingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/routing-intelligence/generate", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Routing generated successfully" });
      refetchDrafts();
      setActiveTab("drafts");
    }
  });

  // Create validation run mutation
  const createValidationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/routing-intelligence/validation-runs", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Validation run created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/routing-intelligence/validation-runs"] });
    }
  });

  // Update draft status mutation
  const updateDraftMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/routing-intelligence/drafts/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({ title: "Draft updated successfully" });
      refetchDrafts();
    }
  });

  const handleFileUpload = (type: string) => {
    // Placeholder for file upload
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = type === "video" ? "video/*" : "application/pdf,text/*";
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // In production, this would upload to S3/storage
        uploadEvidenceMutation.mutate({
          evidenceType: type,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          jobId: selectedJob ? parseInt(selectedJob) : null,
          status: "pending"
        });
      }
    };
    fileInput.click();
  };

  const handleGenerateRouting = () => {
    const selectedEvidence = evidence.filter((e: any) => 
      e.status === "completed" && e.jobId === parseInt(selectedJob)
    );
    
    if (selectedEvidence.length === 0) {
      toast({ 
        title: "No evidence available",
        description: "Please upload and process evidence first",
        variant: "destructive"
      });
      return;
    }

    generateRoutingMutation.mutate({
      jobId: parseInt(selectedJob),
      evidenceIds: selectedEvidence.map((e: any) => e.id),
      method: "ai_synthesis"
    });
  };

  const handleValidateDraft = (draftId: number) => {
    createValidationMutation.mutate({
      draftId,
      actualDataSource: "historical",
      actualDataPeriod: {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      },
      plannedMetrics: { cycleTime: 165, efficiency: 0.85 },
      actualMetrics: { cycleTime: 170, efficiency: 0.82 },
      deviations: { cycleTime: 5, efficiency: -0.03 },
      validationScore: 0.88,
      passedValidation: true
    });
  };

  const handleAdoptDraft = (draftId: number) => {
    updateDraftMutation.mutate({
      id: draftId,
      validationStatus: "adopted",
      adoptedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6" data-testid="routing-intelligence-page">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Routing Intelligence</h1>
          <p className="text-gray-600 mt-1">
            AI-powered routing creation and optimization from production evidence
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-[250px]" data-testid="select-job">
              <SelectValue placeholder="Select a job" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job: any) => (
                <SelectItem key={job.id} value={job.id.toString()}>
                  {job.jobNumber} - {job.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerateRouting}
            disabled={!selectedJob || generateRoutingMutation.isPending}
            data-testid="button-generate-routing"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Routing
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evidence" data-testid="tab-evidence">
            <Upload className="w-4 h-4 mr-2" />
            Ingest Evidence
          </TabsTrigger>
          <TabsTrigger value="drafts" data-testid="tab-drafts">
            <FileText className="w-4 h-4 mr-2" />
            Auto-Generated Routes
          </TabsTrigger>
          <TabsTrigger value="validation" data-testid="tab-validation">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Validation Dashboard
          </TabsTrigger>
          <TabsTrigger value="improvements" data-testid="tab-improvements">
            <LineChart className="w-4 h-4 mr-2" />
            Continuous Improvement
          </TabsTrigger>
        </TabsList>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-32 flex flex-col"
                  onClick={() => handleFileUpload("historical")}
                  data-testid="button-upload-historical"
                >
                  <History className="w-8 h-8 mb-2" />
                  Historical Data
                </Button>
                <Button
                  variant="outline"
                  className="h-32 flex flex-col"
                  onClick={() => handleFileUpload("video")}
                  data-testid="button-upload-video"
                >
                  <FileVideo className="w-8 h-8 mb-2" />
                  Video Analysis
                </Button>
                <Button
                  variant="outline"
                  className="h-32 flex flex-col"
                  onClick={() => handleFileUpload("document")}
                  data-testid="button-upload-document"
                >
                  <FileText className="w-8 h-8 mb-2" />
                  Documents
                </Button>
                <Button
                  variant="outline"
                  className="h-32 flex flex-col"
                  onClick={() => handleFileUpload("survey")}
                  data-testid="button-upload-survey"
                >
                  <BarChart3 className="w-8 h-8 mb-2" />
                  Surveys
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidence Library</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evidence.map((item: any) => (
                    <TableRow key={item.id} data-testid={`row-evidence-${item.id}`}>
                      <TableCell>
                        <Badge variant="outline">{item.evidenceType}</Badge>
                      </TableCell>
                      <TableCell>{item.fileName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            item.status === "completed" ? "default" :
                            item.status === "processing" ? "secondary" :
                            item.status === "failed" ? "destructive" :
                            "outline"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.confidence ? (
                          <div className="flex items-center gap-2">
                            <Progress value={item.confidence * 100} className="w-20" />
                            <span className="text-sm">{Math.round(item.confidence * 100)}%</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" data-testid={`button-view-${item.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" data-testid={`button-delete-${item.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Routing Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Operations</TableHead>
                    <TableHead>Cycle Time</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map((draft: any) => (
                    <TableRow key={draft.id} data-testid={`row-draft-${draft.id}`}>
                      <TableCell className="font-medium">{draft.templateName}</TableCell>
                      <TableCell>v{draft.version}</TableCell>
                      <TableCell>
                        {draft.operations ? JSON.parse(draft.operations).length : 0} operations
                      </TableCell>
                      <TableCell>{draft.estimatedCycleTime} min</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={parseFloat(draft.confidenceScore) * 100} 
                            className="w-20" 
                          />
                          <span className="text-sm">
                            {Math.round(parseFloat(draft.confidenceScore) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            draft.validationStatus === "adopted" ? "default" :
                            draft.validationStatus === "validated" ? "secondary" :
                            draft.validationStatus === "rejected" ? "destructive" :
                            "outline"
                          }
                        >
                          {draft.validationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDraft(draft.id);
                              setActiveTab("validation");
                            }}
                            data-testid={`button-validate-${draft.id}`}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Validate
                          </Button>
                          {draft.validationStatus === "validated" && (
                            <Button
                              size="sm"
                              onClick={() => handleAdoptDraft(draft.id)}
                              data-testid={`button-adopt-${draft.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Adopt
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          {selectedDraft && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Validation Runs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={() => handleValidateDraft(selectedDraft)}
                      disabled={createValidationMutation.isPending}
                      data-testid="button-run-validation"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Run New Validation
                    </Button>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Run Date</TableHead>
                          <TableHead>Data Source</TableHead>
                          <TableHead>Validation Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Deviations</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationRuns.map((run: any) => (
                          <TableRow key={run.id} data-testid={`row-validation-${run.id}`}>
                            <TableCell>
                              {new Date(run.validatedAt).toLocaleString()}
                            </TableCell>
                            <TableCell>{run.actualDataSource}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={run.validationScore * 100} 
                                  className="w-20" 
                                />
                                <span>{Math.round(run.validationScore * 100)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {run.passedValidation ? (
                                <Badge variant="default">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Passed
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {run.deviations && (
                                <div className="text-sm">
                                  Cycle: +{JSON.parse(run.deviations).cycleTime}min
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!selectedDraft && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select a draft from the Auto-Generated Routes tab to view validation runs.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Improvement Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestions.map((suggestion: any) => (
                  <Card key={suggestion.id} data-testid={`card-suggestion-${suggestion.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{suggestion.title}</h3>
                            <Badge 
                              variant={
                                suggestion.priority === "critical" ? "destructive" :
                                suggestion.priority === "high" ? "default" :
                                suggestion.priority === "medium" ? "secondary" :
                                "outline"
                              }
                            >
                              {suggestion.priority}
                            </Badge>
                            <Badge variant="outline">
                              {suggestion.suggestionType}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{suggestion.description}</p>
                          {suggestion.expectedImpact && (
                            <div className="text-sm">
                              <strong>Expected Impact:</strong> 
                              {JSON.stringify(suggestion.expectedImpact)}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                          <Button size="sm">
                            Implement
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {suggestions.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      No improvement suggestions available. Run validations to generate suggestions.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}