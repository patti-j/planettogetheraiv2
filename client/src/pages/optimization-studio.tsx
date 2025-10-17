import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Maximize2, Minimize2, Sparkles, Target, Cpu, Play, 
  CheckCircle, Settings, Database, Monitor, TrendingUp, 
  Code, TestTube, Rocket, BarChart3, Layers, Package,
  Plus, Search, Filter, Edit3, Trash2, Copy, Eye, Clock,
  Code2, MessageSquare, ThumbsUp, ThumbsDown, Bug, 
  Lightbulb, ArrowRight, ChevronDown, ChevronUp, AlertTriangle,
  Shield, Users, FileText, Pause, XCircle, Send, ToggleLeft, ToggleRight
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import BackwardsSchedulingAlgorithm from "@/components/backwards-scheduling-algorithm";
import AlgorithmArchitectureView from "@/components/algorithm-architecture-view";

interface OptimizationAlgorithm {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  type: string;
  baseAlgorithmId?: number;
  version: string;
  status: string;
  isStandard: boolean;
  configuration: any;
  algorithmCode?: string;
  uiComponents: any;
  performance: any;
  approvals: any;
  createdBy: number;
  createdAt: string;
  profile?: AlgorithmProfile;
}

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'physical' | 'policy';
  subcategory: string;
  enabled: boolean;
  severity?: 'error' | 'warning' | 'info';
  customParameters?: Record<string, any>;
}

interface ValidationRulesConfig {
  physical: {
    general: ValidationRule[];
    dependency: ValidationRule[];
    time: ValidationRule[];
    resource: ValidationRule[];
    inventory: ValidationRule[];
  };
  policy: {
    businessRules: ValidationRule[];
    resourceManagement: ValidationRule[];
    timeFlexibility: ValidationRule[];
    processFlow: ValidationRule[];
    materialHandling: ValidationRule[];
    costControl: ValidationRule[];
    qualityCompliance: ValidationRule[];
    optimizationPreferences: ValidationRule[];
  };
}

interface AlgorithmProfile {
  id?: number;
  name: string;
  algorithmId?: number;
  scope: {
    timeHorizon: string; // '1_day', '1_week', '1_month', 'custom'
    includeHistoricalData: boolean;
    dataWindow: number; // days
    resourceSelection: 'all' | 'specific' | 'by_type';
    selectedResources?: string[];
  };
  objectives: {
    primary: string; // 'minimize_makespan', 'maximize_throughput', 'minimize_cost', etc.
    secondary?: string[];
    weights: Record<string, number>; // objective weights for multi-objective optimization
    tradeOffs: {
      speedVsAccuracy: number; // 0-100 scale
      feasibilityVsOptimality: number; // 0-100 scale
    };
  };
  runtimeOptions: {
    maxExecutionTime: number; // seconds
    maxIterations?: number;
    parallelProcessing: boolean;
    incrementalMode: boolean;
    warmStart: boolean;
  };
  constraints: {
    enabled: string[]; // list of constraint IDs to apply
    customRules?: any[];
    strictness: 'relaxed' | 'moderate' | 'strict';
  };
  validationRules?: ValidationRulesConfig;
  outputSettings: {
    format: 'detailed' | 'summary' | 'metrics_only';
    includeVisualization: boolean;
    exportFormats: string[];
  };
}

interface AlgorithmTest {
  id: number;
  algorithmId: number;
  name: string;
  description: string;
  testType: string;
  configuration: any;
  results?: any;
  createdAt: string;
}

interface AlgorithmDeployment {
  id: number;
  algorithmId: number;
  targetModule: string;
  environment: string;
  version: string;
  status: string;
  configuration: any;
  deployedAt: string;
  metrics: any;
}

interface AlgorithmVersion {
  id: number;
  algorithmName: string;
  version: string;
  displayName: string;
  description: string;
  algorithmType: string;
  category: string;
  developmentStatus: string;
  releaseNotes?: string;
  developedBy?: string;
  createdAt: string;
}

interface PlantAlgorithmApproval {
  id: number;
  plantId: number;
  algorithmVersionId: number;
  status: string;
  approvalLevel: string;
  approvedBy?: number;
  approvedAt?: string;
  approvalNotes?: string;
  effectiveDate?: string;
  expirationDate?: string;
  priority: number;
  plant: { name: string };
  algorithmVersion: AlgorithmVersion;
  approvedByUser?: { firstName: string; lastName: string };
}

interface GovernanceDeployment {
  id: number;
  plantApprovalId: number;
  deploymentName: string;
  deploymentType: string;
  status: string;
  deployedAt?: string;
  lastRunAt?: string;
  healthStatus: string;
  runStatistics: {
    total_runs?: number;
    successful_runs?: number;
    failed_runs?: number;
  };
}

// Validation Rules Section Component
const ValidationRulesSection = ({ 
  validationRules, 
  onToggle 
}: { 
  validationRules: ValidationRulesConfig; 
  onToggle: (category: string, subcategory: string, ruleId: string) => void;
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['physical']));

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const countEnabledRules = (rules: ValidationRule[]) => {
    return rules.filter(r => r.enabled).length;
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Physical Constraints */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleCategory('physical')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Physical Constraints</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {countEnabledRules(Object.values(validationRules.physical).flat())} / {Object.values(validationRules.physical).flat().length} enabled
              </Badge>
              {expandedCategories.has('physical') ? 
                <ChevronUp className="w-4 h-4" /> : 
                <ChevronDown className="w-4 h-4" />
              }
            </div>
          </div>
          <CardDescription>Hard constraints that must be satisfied</CardDescription>
        </CardHeader>
        {expandedCategories.has('physical') && (
          <CardContent className="space-y-4">
            {/* General Validation Rules */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">General Validation Rules</h4>
              <div className="space-y-2">
                {validationRules.physical.general.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('physical', 'general', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dependency Constraints */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Dependency Constraints</h4>
              <div className="space-y-2">
                {validationRules.physical.dependency.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('physical', 'dependency', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Constraints */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Time Constraints</h4>
              <div className="space-y-2">
                {validationRules.physical.time.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('physical', 'time', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Constraints */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Resource Constraints</h4>
              <div className="space-y-2">
                {validationRules.physical.resource.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('physical', 'resource', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory/Material Constraints */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Inventory/Material Constraints</h4>
              <div className="space-y-2">
                {validationRules.physical.inventory.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('physical', 'inventory', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Policy Constraints */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleCategory('policy')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base">Policy Constraints</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {countEnabledRules(Object.values(validationRules.policy).flat())} / {Object.values(validationRules.policy).flat().length} enabled
              </Badge>
              {expandedCategories.has('policy') ? 
                <ChevronUp className="w-4 h-4" /> : 
                <ChevronDown className="w-4 h-4" />
              }
            </div>
          </div>
          <CardDescription>Flexible business rules and preferences</CardDescription>
        </CardHeader>
        {expandedCategories.has('policy') && (
          <CardContent className="space-y-4">
            {/* Business Rules */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Business Rules</h4>
              <div className="space-y-2">
                {validationRules.policy.businessRules.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('policy', 'businessRules', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Management */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Resource Management</h4>
              <div className="space-y-2">
                {validationRules.policy.resourceManagement.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('policy', 'resourceManagement', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Flexibility */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Time Flexibility</h4>
              <div className="space-y-2">
                {validationRules.policy.timeFlexibility.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('policy', 'timeFlexibility', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Flow */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Process Flow</h4>
              <div className="space-y-2">
                {validationRules.policy.processFlow.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('policy', 'processFlow', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Material Handling */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Material Handling</h4>
              <div className="space-y-2">
                {validationRules.policy.materialHandling.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('policy', 'materialHandling', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Control */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Cost Control</h4>
              <div className="space-y-2">
                {validationRules.policy.costControl.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('policy', 'costControl', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality & Compliance */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quality & Compliance</h4>
              <div className="space-y-2">
                {validationRules.policy.qualityCompliance.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('policy', 'qualityCompliance', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimization Preferences */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Optimization Preferences</h4>
              <div className="space-y-2">
                {validationRules.policy.optimizationPreferences.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{rule.name}</span>
                        <span className={`text-xs ${getSeverityColor(rule.severity)}`}>({rule.severity})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle('policy', 'optimizationPreferences', rule.id);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      {rule.enabled ? 
                        <ToggleRight className="w-8 h-8 text-green-600" /> : 
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default function OptimizationStudio() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedTab, setSelectedTab] = useState("algorithms");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<OptimizationAlgorithm | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAICreateDialog, setShowAICreateDialog] = useState(false);
  const [showAIModifyDialog, setShowAIModifyDialog] = useState(false);
  const [algorithmToModify, setAlgorithmToModify] = useState<OptimizationAlgorithm | null>(null);
  const [aiModifyPrompt, setAiModifyPrompt] = useState("");
  const [aiModifyMessages, setAiModifyMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSessionMessages, setAiSessionMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [aiSessionActive, setAiSessionActive] = useState(false);
  const [currentAlgorithmDraft, setCurrentAlgorithmDraft] = useState<any>(null);
  const [aiSessionStep, setAiSessionStep] = useState(1);
  const [showBackwardsScheduling, setShowBackwardsScheduling] = useState(false);
  const [showArchitectureView, setShowArchitectureView] = useState(false);
  const [architectureAlgorithmName, setArchitectureAlgorithmName] = useState("");
  const [selectedAlgorithmForDev, setSelectedAlgorithmForDev] = useState<OptimizationAlgorithm | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [expandedFeedback, setExpandedFeedback] = useState<Set<number>>(new Set());
  
  // Algorithm Governance state
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PlantAlgorithmApproval | null>(null);
  const [newApprovalData, setNewApprovalData] = useState({
    algorithmVersionId: null as number | null,
    plantId: null as number | null,
    approvalLevel: "",
    priority: null as number | null,
    notes: ""
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [showExamplesLibrary, setShowExamplesLibrary] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [currentProfileDraft, setCurrentProfileDraft] = useState<AlgorithmProfile | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Default validation rules configuration
  const getDefaultValidationRules = (): ValidationRulesConfig => ({
    physical: {
      general: [
        { id: 'no_overlap', name: 'No overlapping activities', description: 'Prevent activities from overlapping unless overlap feature is enabled', category: 'physical', subcategory: 'general', enabled: true, severity: 'error' },
        { id: 'valid_dates', name: 'Valid date ranges', description: 'Start date must precede end date for all activities', category: 'physical', subcategory: 'general', enabled: true, severity: 'error' },
        { id: 'mandatory_fields', name: 'Mandatory fields', description: 'Activities must include name, duration, and assigned resource', category: 'physical', subcategory: 'general', enabled: true, severity: 'error' },
        { id: 'resource_exists', name: 'Resource existence', description: 'Resources must exist in the system', category: 'physical', subcategory: 'general', enabled: true, severity: 'error' },
        { id: 'resource_available', name: 'Resource availability', description: 'Resources must be available during usage time', category: 'physical', subcategory: 'general', enabled: true, severity: 'warning' }
      ],
      dependency: [
        { id: 'predecessor_logic', name: 'Predecessor/successor logic', description: 'Activities follow dependency relationships (FS, SS, SF, FF)', category: 'physical', subcategory: 'dependency', enabled: true, severity: 'error' },
        { id: 'no_circular', name: 'No circular dependencies', description: 'Prevent circular dependency chains', category: 'physical', subcategory: 'dependency', enabled: true, severity: 'error' }
      ],
      time: [
        { id: 'working_hours', name: 'Working hours alignment', description: 'Activities must align with working hours and holidays', category: 'physical', subcategory: 'time', enabled: true, severity: 'warning' },
        { id: 'lead_lag', name: 'Lead/lag times', description: 'Respect lead and lag times for dependencies', category: 'physical', subcategory: 'time', enabled: true, severity: 'warning' }
      ],
      resource: [
        { id: 'no_overallocation', name: 'No over-allocation', description: 'Resources must not be over-allocated', category: 'physical', subcategory: 'resource', enabled: true, severity: 'error' },
        { id: 'skill_matching', name: 'Skill/capability matching', description: 'Assign activities only to resources with required capabilities', category: 'physical', subcategory: 'resource', enabled: true, severity: 'warning' },
        { id: 'capacity_limits', name: 'Capacity limits', description: 'Respect resource capacity limits (e.g., machine throughput)', category: 'physical', subcategory: 'resource', enabled: true, severity: 'error' }
      ],
      inventory: [
        { id: 'material_available', name: 'Material availability', description: 'Required materials must be available', category: 'physical', subcategory: 'inventory', enabled: true, severity: 'error' },
        { id: 'batch_size', name: 'Batch size rules', description: 'Adhere to minimum/maximum batch size rules', category: 'physical', subcategory: 'inventory', enabled: false, severity: 'warning' }
      ]
    },
    policy: {
      businessRules: [
        { id: 'priority_order', name: 'Priority ordering', description: 'High-priority activities get precedence', category: 'policy', subcategory: 'businessRules', enabled: true, severity: 'info' },
        { id: 'need_dates', name: 'Meet need dates', description: 'Jobs/orders must meet their need dates', category: 'policy', subcategory: 'businessRules', enabled: true, severity: 'warning' },
        { id: 'budget_limits', name: 'Budget constraints', description: 'Stay within budgeted labor/resource costs', category: 'policy', subcategory: 'businessRules', enabled: false, severity: 'warning' }
      ],
      resourceManagement: [
        { id: 'limit_overtime', name: 'Limit overtime', description: 'Control overtime to manage labor costs', category: 'policy', subcategory: 'resourceManagement', enabled: false, severity: 'info' }
      ],
      timeFlexibility: [
        { id: 'weekend_work', name: 'Weekend/holiday work', description: 'Permit work on weekends/holidays to meet deadlines', category: 'policy', subcategory: 'timeFlexibility', enabled: false, severity: 'info' },
        { id: 'workload_balance', name: 'Workload balancing', description: 'Balance workload across shifts to avoid bottlenecks', category: 'policy', subcategory: 'timeFlexibility', enabled: true, severity: 'info' },
        { id: 'prevent_setup_conflict', name: 'Prevent setup conflicts', description: 'Prevent same setup type on multiple resources simultaneously', category: 'policy', subcategory: 'timeFlexibility', enabled: false, severity: 'warning' }
      ],
      processFlow: [
        { id: 'parallel_processing', name: 'Parallel processing', description: 'Allow parallel processing for non-dependent activities', category: 'policy', subcategory: 'processFlow', enabled: true, severity: 'info' },
        { id: 'alternative_routing', name: 'Alternative routing', description: 'Permit alternative routing when primary machines are busy', category: 'policy', subcategory: 'processFlow', enabled: false, severity: 'info' },
        { id: 'skip_noncritical', name: 'Skip non-critical steps', description: 'Skip non-critical steps for low-priority orders', category: 'policy', subcategory: 'processFlow', enabled: false, severity: 'info' }
      ],
      materialHandling: [
        { id: 'jit_delivery', name: 'Just-in-time delivery', description: 'Schedule assuming just-in-time material delivery', category: 'policy', subcategory: 'materialHandling', enabled: false, severity: 'info' },
        { id: 'substitute_materials', name: 'Material substitution', description: 'Allow substitute materials when primary unavailable', category: 'policy', subcategory: 'materialHandling', enabled: false, severity: 'info' },
        { id: 'partial_material_start', name: 'Partial material start', description: 'Start activities with partial materials if full stock expected', category: 'policy', subcategory: 'materialHandling', enabled: false, severity: 'warning' }
      ],
      costControl: [
        { id: 'avoid_peak_rates', name: 'Avoid peak utility rates', description: 'Avoid high-energy activities during peak rate periods', category: 'policy', subcategory: 'costControl', enabled: false, severity: 'info' },
        { id: 'cost_efficiency', name: 'Cost-efficient priority', description: 'Prioritize cost-efficient activities over speed', category: 'policy', subcategory: 'costControl', enabled: false, severity: 'info' },
        { id: 'premium_resource_limit', name: 'Limit premium resources', description: 'Restrict use of premium resources unless necessary', category: 'policy', subcategory: 'costControl', enabled: false, severity: 'info' }
      ],
      qualityCompliance: [
        { id: 'deferred_inspections', name: 'Deferred inspections', description: 'Allow deferred inspections post-production', category: 'policy', subcategory: 'qualityCompliance', enabled: false, severity: 'warning' },
        { id: 'parameter_tolerance', name: 'Parameter tolerance', description: 'Accept minor deviations within tolerance', category: 'policy', subcategory: 'qualityCompliance', enabled: false, severity: 'info' },
        { id: 'audit_trails', name: 'Detailed audit trails', description: 'Enable/disable detailed audit trails by product/customer', category: 'policy', subcategory: 'qualityCompliance', enabled: true, severity: 'info' }
      ],
      optimizationPreferences: [
        { id: 'minimize_makespan', name: 'Minimize makespan', description: 'Complete jobs as quickly as possible', category: 'policy', subcategory: 'optimizationPreferences', enabled: true, severity: 'info' },
        { id: 'maximize_utilization', name: 'Maximize utilization', description: 'Maximize machine utilization over labor cost', category: 'policy', subcategory: 'optimizationPreferences', enabled: false, severity: 'info' },
        { id: 'prioritize_margin', name: 'Prioritize high-margin', description: 'Prioritize high-margin orders when capacity limited', category: 'policy', subcategory: 'optimizationPreferences', enabled: false, severity: 'info' }
      ]
    }
  });

  // Fetch optimization algorithms
  const { data: algorithms = [], isLoading: algorithmsLoading } = useQuery({
    queryKey: ['/api/optimization/algorithms']
  });

  // Fetch standard algorithms
  const { data: standardAlgorithms = [] } = useQuery({
    queryKey: ['/api/optimization/standard-algorithms']
  });

  // Fetch algorithm tests
  const { data: tests = [] } = useQuery({
    queryKey: ['/api/optimization/tests']
  });

  // Fetch deployments
  const { data: deployments = [] } = useQuery({
    queryKey: ['/api/optimization/deployments']
  });

  // Fetch algorithm feedback for development purposes
  const { data: algorithmFeedback = [] } = useQuery({
    queryKey: ['/api/algorithm-feedback']
  });

  // Fetch algorithm versions for governance
  // Comment out algorithmVersions query - endpoint doesn't exist yet
  // const { data: algorithmVersions = [] } = useQuery({
  //   queryKey: ['/api/algorithm-versions'],
  //   queryFn: async () => {
  //     const response = await fetch('/api/algorithm-versions');
  //     if (!response.ok) throw new Error('Failed to fetch algorithm versions');
  //     return response.json();
  //   }
  // });
  const algorithmVersions: any[] = [];

  // Fetch algorithm approvals for governance
  const { data: algorithmApprovals = [] } = useQuery({
    queryKey: selectedPlantId 
      ? [`/api/algorithm-governance/approvals?plantId=${selectedPlantId}`] 
      : ['/api/algorithm-governance/approvals']
  });

  // Comment out governanceDeployments query - endpoint doesn't exist yet
  // const { data: governanceDeployments = [] } = useQuery({
  //   queryKey: ['/api/algorithm-governance/deployments', selectedPlantId],
  //   queryFn: async () => {
  //     const url = selectedPlantId 
  //       ? `/api/algorithm-governance/deployments?plantId=${selectedPlantId}`
  //       : '/api/algorithm-governance/deployments';
  //     const response = await fetch(url);
  //     if (!response.ok) throw new Error('Failed to fetch governance deployments');
  //     return response.json();
  //   }
  // });
  const governanceDeployments: any[] = [];

  // Fetch plants for governance
  const { data: plants = [] } = useQuery({
    queryKey: ['/api/plants'],
    queryFn: async () => {
      const response = await fetch('/api/plants');
      if (!response.ok) throw new Error('Failed to fetch plants');
      return response.json();
    }
  });

  // Fetch feedback for specific algorithm when selected
  const { data: selectedAlgorithmFeedback = [] } = useQuery({
    queryKey: ['/api/algorithm-feedback/algorithm', selectedAlgorithmForDev?.name],
    queryFn: async () => {
      if (!selectedAlgorithmForDev?.name) return [];
      const response = await fetch(`/api/algorithm-feedback/algorithm/${selectedAlgorithmForDev.name}`);
      if (!response.ok) throw new Error('Failed to fetch algorithm feedback');
      return response.json();
    },
    enabled: !!selectedAlgorithmForDev
  });

  // Create algorithm mutation
  const createAlgorithmMutation = useMutation({
    mutationFn: async (algorithmData: any) => {
      const response = await fetch('/api/optimization/algorithms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(algorithmData)
      });
      if (!response.ok) throw new Error('Failed to create algorithm');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/optimization/algorithms'] });
      setShowCreateDialog(false);
      toast({ title: "Algorithm created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating algorithm", description: error.message, variant: "destructive" });
    }
  });

  // AI collaborative session mutation
  const aiCollaborateSession = useMutation({
    mutationFn: async ({ message, sessionData }: { message: string; sessionData: any }) => {
      console.log('Sending collaborative algorithm request:', {
        message,
        sessionMessages: aiSessionMessages,
        currentDraft: currentAlgorithmDraft,
        step: aiSessionStep
      });
      
      const response = await fetch('/api/algorithm-collaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionMessages: aiSessionMessages,
          currentDraft: currentAlgorithmDraft,
          step: aiSessionStep,
          ...sessionData
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        // Try to parse the error response
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          const error = new Error(errorData.error || 'Failed to process AI collaboration');
          (error as any).details = errorData.details;
          throw error;
        } catch (e) {
          if (e instanceof Error && e.message) {
            throw e;
          }
          throw new Error('Failed to process AI collaboration');
        }
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAiSessionMessages(prev => [...prev, 
        { role: 'user', content: aiPrompt },
        { role: 'assistant', content: data.response }
      ]);
      
      if (data.algorithmDraft) {
        setCurrentAlgorithmDraft(data.algorithmDraft);
      }
      
      if (data.profileDraft) {
        setCurrentProfileDraft(data.profileDraft);
      }
      
      if (data.nextStep) {
        setAiSessionStep(data.nextStep);
        // Auto-generate profile at step 4
        if (data.nextStep === 4 && !currentProfileDraft && data.algorithmDraft) {
          generateDefaultProfile(data.algorithmDraft);
        }
      }
      
      setAiPrompt("");
    },
    onError: (error: any) => {
      console.error('AI collaboration error:', error);
      
      // Extract error message and details
      const errorMessage = error.message || 'Failed to process AI collaboration';
      const errorDetails = error.details || 'Please check your OpenAI API key configuration and try again.';
      
      toast({ 
        title: errorMessage, 
        description: errorDetails, 
        variant: "destructive" 
      });
    }
  });

  // AI algorithm modification mutation
  const aiModifyAlgorithmMutation = useMutation({
    mutationFn: async ({ algorithmId, modificationRequest }: { algorithmId: number; modificationRequest: string }) => {
      const response = await fetch('/api/algorithm-modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithmId,
          modificationRequest,
          messages: aiModifyMessages
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to modify algorithm');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setAiModifyMessages(prev => [...prev, 
        { role: 'user', content: aiModifyPrompt },
        { role: 'assistant', content: data.response }
      ]);
      
      // Always show a toast when AI responds
      toast({ 
        title: "AI Response Received", 
        description: "The AI has analyzed your request and provided recommendations." 
      });
      
      if (data.modifiedAlgorithm) {
        // Update the algorithm in the cache
        queryClient.setQueryData(['/api/optimization/algorithms'], (oldData: OptimizationAlgorithm[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(alg => 
            alg.id === data.modifiedAlgorithm.id ? { ...alg, ...data.modifiedAlgorithm } : alg
          );
        });
        
        setAlgorithmToModify(data.modifiedAlgorithm);
        toast({ 
          title: "Algorithm modified successfully", 
          description: "The algorithm has been updated with your changes." 
        });
      }
      
      setAiModifyPrompt("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error modifying algorithm", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Finalize AI algorithm creation
  const finalizeAIAlgorithmMutation = useMutation({
    mutationFn: async (finalAlgorithm: any) => {
      // Include the profile with the algorithm
      const algorithmWithProfile = {
        ...finalAlgorithm,
        profile: currentProfileDraft
      };
      
      const response = await fetch('/api/optimization/algorithms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(algorithmWithProfile)
      });
      if (!response.ok) throw new Error('Failed to create final algorithm');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/optimization/algorithms'] });
      setShowAICreateDialog(false);
      resetAISession();
      toast({ 
        title: "Algorithm created successfully", 
        description: "Your AI-developed algorithm and runtime profile are ready for testing!" 
      });
    },
    onError: (error: any) => {
      toast({ title: "Error creating algorithm", description: error.message, variant: "destructive" });
    }
  });

  // Approve algorithm mutation
  const approveAlgorithmMutation = useMutation({
    mutationFn: async ({ approvalId, notes }: { approvalId: number; notes?: string }) => {
      const response = await fetch(`/api/algorithm-governance/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve algorithm');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithm-governance/approvals'] });
      toast({ title: "Algorithm approved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error approving algorithm", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Unapprove algorithm mutation
  const unapproveAlgorithmMutation = useMutation({
    mutationFn: async ({ approvalId, reason }: { approvalId: number; reason?: string }) => {
      const response = await fetch(`/api/algorithm-governance/approvals/${approvalId}/unapprove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unapprove algorithm');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithm-governance/approvals'] });
      toast({ title: "Algorithm approval revoked successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error revoking approval", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Reject algorithm mutation
  const rejectAlgorithmMutation = useMutation({
    mutationFn: async ({ approvalId, reason }: { approvalId: number; reason?: string }) => {
      const response = await fetch(`/api/algorithm-governance/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject algorithm');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithm-governance/approvals'] });
      toast({ title: "Algorithm rejected successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error rejecting algorithm", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Create new approval request mutation
  const createApprovalMutation = useMutation({
    mutationFn: async (approvalData: {
      algorithmVersionId: number;
      plantId: number;
      approvalLevel: string;
      priority: number;
      notes?: string;
    }) => {
      const response = await fetch('/api/algorithm-governance/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create approval request');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithm-governance/approvals'] });
      setShowApprovalDialog(false);
      setNewApprovalData({
        algorithmVersionId: null,
        plantId: null,
        approvalLevel: "",
        priority: null,
        notes: ""
      });
      toast({ title: "Approval request created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating approval request", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Reset AI session
  const resetAISession = () => {
    setAiSessionMessages([]);
    setAiSessionActive(false);
    setCurrentAlgorithmDraft(null);
    setCurrentProfileDraft(null);
    setAiSessionStep(1);
    setAiPrompt("");
    setSelectedTemplate(null);
  };
  
  // Generate default profile based on algorithm
  const generateDefaultProfile = (algorithm: any) => {
    const profile: AlgorithmProfile = {
      name: `${algorithm.name}_default_profile`,
      scope: {
        timeHorizon: algorithm.category === 'scheduling' ? '1_week' : '1_month',
        includeHistoricalData: true,
        dataWindow: 30,
        resourceSelection: 'all',
        selectedResources: []
      },
      objectives: {
        primary: algorithm.objective || 'minimize_cost',
        secondary: [],
        weights: { [algorithm.objective || 'minimize_cost']: 1.0 },
        tradeOffs: {
          speedVsAccuracy: 70,
          feasibilityVsOptimality: 60
        }
      },
      runtimeOptions: {
        maxExecutionTime: 300,
        maxIterations: 1000,
        parallelProcessing: true,
        incrementalMode: false,
        warmStart: false
      },
      constraints: {
        enabled: algorithm.constraints || [],
        customRules: [],
        strictness: 'moderate'
      },
      validationRules: getDefaultValidationRules(),
      outputSettings: {
        format: 'detailed',
        includeVisualization: true,
        exportFormats: ['json', 'csv']
      }
    };
    setCurrentProfileDraft(profile);
  };

  // Handle validation rule toggle
  const handleValidationRuleToggle = (category: string, subcategory: string, ruleId: string) => {
    if (!currentProfileDraft) return;
    
    const updatedProfile = { ...currentProfileDraft };
    if (!updatedProfile.validationRules) {
      updatedProfile.validationRules = getDefaultValidationRules();
    }
    
    // Find and toggle the rule
    const categoryRules = updatedProfile.validationRules[category as keyof ValidationRulesConfig];
    const subcategoryRules = categoryRules[subcategory as keyof typeof categoryRules] as ValidationRule[];
    
    const ruleIndex = subcategoryRules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      subcategoryRules[ruleIndex] = {
        ...subcategoryRules[ruleIndex],
        enabled: !subcategoryRules[ruleIndex].enabled
      };
    }
    
    setCurrentProfileDraft(updatedProfile);
  };

  // Start AI collaboration session
  const startAISession = (template?: string) => {
    setAiSessionActive(true);
    let initialMessage = "Hello! I'm here to help you develop a custom optimization algorithm step by step.";
    
    if (template) {
      setSelectedTemplate(template);
      initialMessage += `\n\nI see you've selected the **${template}** template as your starting point. This template provides a proven foundation for ${getTemplateDescription(template)}.\n\n`;
    } else {
      initialMessage += "\n\n";
    }
    
    initialMessage += "**Step 1: Problem Definition**\n\nCould you describe the optimization problem you're trying to solve? For example:\n- What type of manufacturing process needs optimization?\n- What are your main objectives (minimize cost, maximize throughput, reduce setup times, etc.)?\n- Are there any specific constraints or limitations I should know about?";
    
    if (template) {
      initialMessage += `\n\n*Note: Since you're using the ${template} template, I'll adapt the standard approach to better fit your specific needs.*`;
    }
    
    setAiSessionMessages([{
      role: 'assistant',
      content: initialMessage
    }]);
    setAiSessionStep(1);
  };
  
  // Get template description
  const getTemplateDescription = (template: string) => {
    const templates: Record<string, string> = {
      'scheduling': 'optimizing production schedules to minimize makespan and tardiness',
      'inventory': 'balancing inventory levels to reduce holding costs while preventing stockouts',
      'capacity': 'maximizing resource utilization while meeting demand requirements',
      'routing': 'determining optimal production paths through work centers',
      'sequencing': 'ordering jobs to minimize changeover times and setup costs',
      'forecasting': 'predicting demand patterns to improve planning accuracy'
    };
    return templates[template] || 'general optimization problems';
  };
  
  // Initialize AI session with message when dialog opens but messages are empty
  useEffect(() => {
    if (showAICreateDialog && aiSessionActive && aiSessionMessages.length === 0) {
      // If session is active but no messages, add initial message
      const initialMessage = selectedTemplate 
        ? `Hello! I see you've selected the **${selectedTemplate}** template. This is a great starting point for ${getTemplateDescription(selectedTemplate)}.\n\n**Step 1: Problem Definition**\n\nCould you describe the specific optimization challenge you're facing? What makes this problem unique for your operation?`
        : `Hello! I'm here to help you create a custom optimization algorithm tailored to your needs.\n\n**Step 1: Problem Definition**\n\nLet's start by understanding your optimization challenge. Could you describe:\n• What process or operation needs optimization?\n• What are your main objectives (cost, time, quality)?\n• Any specific constraints or limitations?`;
      
      setAiSessionMessages([{ role: 'assistant', content: initialMessage }]);
    }
  }, [showAICreateDialog, aiSessionActive, selectedTemplate]);

  // Filter algorithms based on category and search
  const filteredAlgorithms = algorithms.filter((algo: OptimizationAlgorithm) => {
    const matchesCategory = selectedCategory === "all" || algo.category === selectedCategory;
    const matchesSearch = algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         algo.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter feedback based on filter selection
  const filteredFeedback = selectedAlgorithmFeedback.filter((feedback: any) => {
    if (feedbackFilter === "all") return true;
    if (feedbackFilter === "bugs") return feedback.feedbackType === "bug_report" || feedback.feedbackType === "bug";
    if (feedbackFilter === "improvements") return feedback.feedbackType === "improvement_suggestion" || feedback.feedbackType === "improvement";
    if (feedbackFilter === "critical") return feedback.severity === "critical" || feedback.severity === "high";
    if (feedbackFilter === "max") {
      // Check if feedback is from Max AI Assistant (submitted by Max system user or has Max-specific metadata)
      return feedback.submittedBy === 9 || // Max system user ID
             (feedback.executionContext && feedback.executionContext.feedbackSource === "max_ai_assistant") ||
             feedback.title?.includes("[AUTOMATED FEEDBACK]");
    }
    return true;
  });

  // Helper function to get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Helper function to get feedback type icon
  const getFeedbackIcon = (feedbackType: string) => {
    switch (feedbackType) {
      case 'bug_report': return <Bug className="w-4 h-4" />;
      case 'improvement_suggestion': return <Lightbulb className="w-4 h-4" />;
      case 'performance_issue': return <AlertTriangle className="w-4 h-4" />;
      case 'positive_feedback': return <ThumbsUp className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Toggle feedback expansion
  const toggleFeedbackExpansion = (feedbackId: number) => {
    setExpandedFeedback(prev => {
      const newSet = new Set(prev);
      if (newSet.has(feedbackId)) {
        newSet.delete(feedbackId);
      } else {
        newSet.add(feedbackId);
      }
      return newSet;
    });
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "production_planning", label: "Production Planning" },
    { value: "schedule_optimization", label: "Schedule Optimization" },
    { value: "inventory_optimization", label: "Inventory Optimization" },
    { value: "capacity_optimization", label: "Capacity Optimization" },
    { value: "demand_forecasting", label: "Demand Forecasting" },
    { value: "ctp_optimization", label: "Capable to Promise (CTP) Optimization" },
    { value: "order_optimization", label: "Order Optimization" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'testing': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'deployed': return 'bg-blue-500';
      case 'retired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const AlgorithmCard = ({ algorithm }: { algorithm: OptimizationAlgorithm }) => (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg leading-tight text-gray-900 dark:text-gray-100">{algorithm.displayName}</CardTitle>
            <CardDescription className="mt-1 text-sm line-clamp-2 text-gray-600 dark:text-gray-400">{algorithm.description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:ml-4">
            <Badge className={`${getStatusColor(algorithm.status)} text-white text-xs`}>
              {algorithm.status}
            </Badge>
            {algorithm.isStandard && (
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Standard
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
          <span className="capitalize truncate">{algorithm.category.replace('_', ' ')}</span>
          <span className="text-xs ml-2">v{algorithm.version}</span>
        </div>
        
        {algorithm.performance && Object.keys(algorithm.performance).length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
              <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
              <span>Performance: {algorithm.performance.score || 'N/A'}</span>
            </div>
          </div>
        )}
        
        <div className="flex-1"></div>
        
        {/* Action Buttons - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button 
            size="sm" 
            className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAlgorithm(algorithm);
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details & Performance
          </Button>
          {algorithm.name === 'backwards-scheduling' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full sm:flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setArchitectureAlgorithmName(algorithm.displayName);
                setShowArchitectureView(true);
              }}
            >
              <Cpu className="w-4 h-4 mr-2" />
              Architecture
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Show algorithm architecture view if selected
  if (showArchitectureView) {
    return (
      <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
        <Button
          onClick={() => setIsMaximized(!isMaximized)}
          className="hidden sm:flex fixed top-2 right-16 z-50"
          size="icon"
          variant="outline"
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
        
        <div className={`p-3 sm:p-6 space-y-4 sm:space-y-6 ${isMaximized ? '' : ''}`}>
          <AlgorithmArchitectureView 
            algorithmName={architectureAlgorithmName}
            onClose={() => setShowArchitectureView(false)}
          />
        </div>
      </div>
    );
  }

  // Show backwards scheduling algorithm if selected
  if (showBackwardsScheduling) {
    return (
      <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
        <Button
          onClick={() => setIsMaximized(!isMaximized)}
          className="hidden sm:flex fixed top-2 right-16 z-50"
          size="icon"
          variant="outline"
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
        
        <div className={`p-3 sm:p-6 space-y-4 sm:space-y-6 ${isMaximized ? '' : ''}`}>
          <BackwardsSchedulingAlgorithm onNavigateBack={() => setShowBackwardsScheduling(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Maximize/Minimize Button */}
      <Button
        onClick={() => setIsMaximized(!isMaximized)}
        className="hidden sm:flex fixed top-2 right-16 z-50"
        size="icon"
        variant="outline"
      >
        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </Button>

      <div className={`p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 ${isMaximized ? '' : ''}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6" />
              Optimization Studio
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
              Define, customize, test, and deploy optimization algorithms across manufacturing functions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
            <Dialog open={showAICreateDialog} onOpenChange={(open) => {
              setShowAICreateDialog(open);
              if (!open) resetAISession();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Collaborate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[70vh] sm:h-[85vh] max-h-[70vh] sm:max-h-[85vh] w-[95vw] sm:w-full flex flex-col overflow-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                <DialogHeader className="flex-shrink-0 pb-2">
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI Algorithm Development Assistant
                    {aiSessionActive && (
                      <Badge variant="outline" className="ml-2">
                        Step {aiSessionStep}/5
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    Work collaboratively with AI to develop a sophisticated optimization algorithm tailored to your specific needs
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  {!aiSessionActive ? (
                    /* Initial Introduction */
                    <div className="flex-1 overflow-y-auto space-y-4 p-1" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <Sparkles className="w-5 h-5 text-white flex-shrink-0" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Let's Build Your Algorithm Together</h3>
                            <p className="text-gray-700 dark:text-gray-300">
                              I'll guide you through a step-by-step process to understand your requirements and develop a custom optimization algorithm. This includes:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                              <li><strong>Problem Analysis:</strong> Understanding your specific optimization challenges</li>
                              <li><strong>Objective Definition:</strong> Clarifying what you want to optimize for</li>
                              <li><strong>Constraint Identification:</strong> Mapping out limitations and requirements</li>
                              <li><strong>Algorithm Design:</strong> Creating the optimization logic and parameters</li>
                              <li><strong>Runtime Profile:</strong> Configuring execution scope, objectives, and performance settings</li>
                            </ul>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                              The process typically takes 10-15 minutes and results in a production-ready algorithm.
                            </p>
                          </div>
                        </div>
                      </Card>
                      
                      {/* Algorithm Templates */}
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                          <Package className="w-4 h-4" />
                          Choose a Starting Point
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => startAISession()}
                            className="flex flex-col items-center p-3 h-auto"
                          >
                            <Plus className="w-5 h-5 mb-1" />
                            <span className="text-xs">From Scratch</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => startAISession('scheduling')}
                            className="flex flex-col items-center p-3 h-auto"
                          >
                            <Clock className="w-5 h-5 mb-1" />
                            <span className="text-xs">Scheduling</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => startAISession('inventory')}
                            className="flex flex-col items-center p-3 h-auto"
                          >
                            <Package className="w-5 h-5 mb-1" />
                            <span className="text-xs">Inventory</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => startAISession('capacity')}
                            className="flex flex-col items-center p-3 h-auto"
                          >
                            <Cpu className="w-5 h-5 mb-1" />
                            <span className="text-xs">Capacity</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => startAISession('routing')}
                            className="flex flex-col items-center p-3 h-auto"
                          >
                            <ArrowRight className="w-5 h-5 mb-1" />
                            <span className="text-xs">Routing</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => startAISession('sequencing')}
                            className="flex flex-col items-center p-3 h-auto"
                          >
                            <Layers className="w-5 h-5 mb-1" />
                            <span className="text-xs">Sequencing</span>
                          </Button>
                        </div>
                      </Card>
                      
                      {/* Quick Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowExamplesLibrary(true)}
                          className="flex-1"
                        >
                          <Lightbulb className="w-4 h-4 mr-2" />
                          View Example Algorithms
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (algorithms.length > 0) {
                              setSelectedAlgorithmForDev(algorithms[0]);
                              setSelectedTab('development');
                            }
                          }}
                          className="flex-1"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Modify Existing Algorithm
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Active Session Interface */
                    <div className="flex flex-col h-full overflow-hidden">
                      {/* Progress Indicator */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg flex-shrink-0 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Development Progress</span>
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{aiSessionStep}/5 Steps Complete</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
                            style={{ width: `${(aiSessionStep / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Conversation Area - Mobile optimized with fixed height */}
                      <div 
                        className="flex-1 overflow-y-auto border rounded-lg p-2 sm:p-4 space-y-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 mb-2" 
                        style={{ 
                          WebkitOverflowScrolling: 'touch',
                          overscrollBehavior: 'contain',
                          touchAction: 'pan-y',
                          minHeight: '100px',
                          maxHeight: 'calc(100% - 250px)'  // Reserve space for input area
                        }}
                      >
                        {aiSessionMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full min-h-[200px] text-gray-500 dark:text-gray-400">
                            <div className="text-center p-4">
                              <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                              <p className="text-sm">Starting AI collaboration session...</p>
                              <p className="text-xs mt-1">Please wait a moment while I prepare.</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {aiSessionMessages.map((message, index) => (
                              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg ${
                                  message.role === 'user' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                }`}>
                                  <div className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</div>
                                </div>
                              </div>
                            ))}
                            {aiCollaborateSession.isPending && (
                              <div className="flex justify-start">
                                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-3 rounded-lg">
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                    AI is thinking...
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Current Algorithm & Profile Preview - Hidden on mobile to save space */}
                      <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-3 mb-2">
                        {currentAlgorithmDraft && (
                          <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                                  <Target className="w-4 h-4" />
                                  Algorithm Draft
                                </h4>
                                <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                  <div><strong>Name:</strong> {currentAlgorithmDraft.name}</div>
                                  <div><strong>Objective:</strong> {currentAlgorithmDraft.objective}</div>
                                  <div><strong>Category:</strong> {currentAlgorithmDraft.category}</div>
                                  {currentAlgorithmDraft.parameters && (
                                    <div><strong>Parameters:</strong> {Object.keys(currentAlgorithmDraft.parameters).length} configured</div>
                                  )}
                                  {currentAlgorithmDraft.constraints && (
                                    <div><strong>Constraints:</strong> {currentAlgorithmDraft.constraints.length} defined</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowCodePreview(true)}
                                >
                                  <Code2 className="w-3 h-3 mr-1" />
                                  View Code
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )}
                        
                        {currentProfileDraft && (
                          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                                  <Settings className="w-4 h-4" />
                                  Runtime Profile
                                </h4>
                                <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                  <div><strong>Scope:</strong> {currentProfileDraft.scope.timeHorizon.replace('_', ' ')}</div>
                                  <div><strong>Primary Goal:</strong> {currentProfileDraft.objectives.primary.replace(/_/g, ' ')}</div>
                                  <div><strong>Max Time:</strong> {currentProfileDraft.runtimeOptions.maxExecutionTime}s</div>
                                  <div><strong>Constraints:</strong> {currentProfileDraft.constraints.strictness}</div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="text-xs">
                                      <span className="font-medium">Speed:</span> {currentProfileDraft.objectives.tradeOffs.speedVsAccuracy}%
                                    </div>
                                    <div className="text-xs">
                                      <span className="font-medium">Accuracy:</span> {100 - currentProfileDraft.objectives.tradeOffs.speedVsAccuracy}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowProfileEditor(true)}
                                >
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )}
                      </div>

                      {/* Input Area - Fixed at bottom with proper mobile styling */}
                      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t dark:border-gray-700 pt-2 space-y-2">
                        <Textarea
                          placeholder="Type your response or ask questions about the algorithm development..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          rows={window.innerWidth < 640 ? 2 : 3}
                          className="resize-none text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (aiPrompt.trim()) {
                                aiCollaborateSession.mutate({ message: aiPrompt, sessionData: {} });
                              }
                            }
                          }}
                          style={{ 
                            WebkitAppearance: 'none',
                            fontSize: '16px'  // Prevents zoom on iOS
                          }}
                        />
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                            Press Enter to send, Shift+Enter for new line
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={resetAISession}
                              className="text-xs sm:text-sm"
                            >
                              Start Over
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => aiCollaborateSession.mutate({ message: aiPrompt, sessionData: {} })}
                              disabled={!aiPrompt.trim() || aiCollaborateSession.isPending}
                              className="bg-gradient-to-r from-purple-500 to-pink-600 text-xs sm:text-sm flex-1 sm:flex-initial"
                            >
                              Send
                            </Button>
                            {aiSessionStep >= 5 && currentAlgorithmDraft && currentProfileDraft && (
                              <Button 
                                size="sm"
                                onClick={() => finalizeAIAlgorithmMutation.mutate(currentAlgorithmDraft)}
                                disabled={finalizeAIAlgorithmMutation.isPending}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-xs sm:text-sm"
                              >
                                {finalizeAIAlgorithmMutation.isPending ? "Creating..." : "Create"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Code Preview Dialog */}
            <Dialog open={showCodePreview} onOpenChange={setShowCodePreview}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Code2 className="w-5 h-5" />
                    Algorithm Code Preview
                  </DialogTitle>
                  <DialogDescription>
                    Generated algorithm code based on your specifications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {currentAlgorithmDraft && (
                    <div className="space-y-3">
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">
                          <code>{`// Algorithm: ${currentAlgorithmDraft.name}
// Category: ${currentAlgorithmDraft.category}
// Objective: ${currentAlgorithmDraft.objective}

class ${currentAlgorithmDraft.name?.replace(/-/g, '_')}Algorithm {
  constructor(parameters) {
    this.parameters = parameters;
    ${currentAlgorithmDraft.constraints?.map((c: any) => `this.constraints.push('${c}');`).join('\n    ') || ''}
  }

  async optimize(data) {
    // Step 1: Validate input data
    if (!this.validateInput(data)) {
      throw new Error('Invalid input data');
    }

    // Step 2: Apply constraints
    const constrainedData = this.applyConstraints(data);

    // Step 3: Execute optimization logic
    const solution = await this.executeOptimization(constrainedData);

    // Step 4: Validate solution
    if (!this.validateSolution(solution)) {
      throw new Error('Solution violates constraints');
    }

    return solution;
  }

  validateInput(data) {
    // Implement input validation logic
    return data && data.length > 0;
  }

  applyConstraints(data) {
    // Apply algorithm-specific constraints
    return data;
  }

  async executeOptimization(data) {
    // Main optimization logic goes here
    ${selectedTemplate === 'scheduling' ? `
    // Scheduling optimization logic
    const sortedJobs = this.sortByPriority(data);
    const schedule = this.createSchedule(sortedJobs);
    return this.optimizeSchedule(schedule);` : 
      selectedTemplate === 'inventory' ? `
    // Inventory optimization logic
    const demand = this.forecastDemand(data);
    const optimalLevels = this.calculateOptimalLevels(demand);
    return this.generateOrders(optimalLevels);` : `
    // Custom optimization logic
    const processedData = this.processData(data);
    return this.findOptimalSolution(processedData);`}
  }

  validateSolution(solution) {
    // Validate that solution meets all constraints
    return solution !== null;
  }
}`}</code>
                        </pre>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCodePreview(false)}>
                          Close
                        </Button>
                        <Button onClick={() => {
                          navigator.clipboard.writeText(currentAlgorithmDraft.code || 'No code generated');
                          toast({ title: "Code copied to clipboard" });
                        }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Profile Editor Dialog */}
            <Dialog open={showProfileEditor} onOpenChange={setShowProfileEditor}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Algorithm Runtime Profile Configuration
                  </DialogTitle>
                  <DialogDescription>
                    Configure how the algorithm executes at runtime - scope, objectives, and performance settings
                  </DialogDescription>
                </DialogHeader>
                
                {currentProfileDraft && (
                  <div className="space-y-6">
                    {/* Scope Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Execution Scope</CardTitle>
                        <CardDescription>Define what data the algorithm will process</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Time Horizon</Label>
                            <Select 
                              value={currentProfileDraft.scope.timeHorizon}
                              onValueChange={(value) => setCurrentProfileDraft({
                                ...currentProfileDraft,
                                scope: { ...currentProfileDraft.scope, timeHorizon: value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1_day">1 Day</SelectItem>
                                <SelectItem value="1_week">1 Week</SelectItem>
                                <SelectItem value="2_weeks">2 Weeks</SelectItem>
                                <SelectItem value="1_month">1 Month</SelectItem>
                                <SelectItem value="3_months">3 Months</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Data Window (days)</Label>
                            <Input 
                              type="number" 
                              value={currentProfileDraft.scope.dataWindow}
                              onChange={(e) => setCurrentProfileDraft({
                                ...currentProfileDraft,
                                scope: { ...currentProfileDraft.scope, dataWindow: parseInt(e.target.value) || 30 }
                              })}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Resource Selection</Label>
                          <Select 
                            value={currentProfileDraft.scope.resourceSelection}
                            onValueChange={(value: any) => setCurrentProfileDraft({
                              ...currentProfileDraft,
                              scope: { ...currentProfileDraft.scope, resourceSelection: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Resources</SelectItem>
                              <SelectItem value="specific">Specific Resources</SelectItem>
                              <SelectItem value="by_type">By Resource Type</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Objectives Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Optimization Objectives</CardTitle>
                        <CardDescription>Set priorities and trade-offs for the algorithm</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Primary Objective</Label>
                          <Select 
                            value={currentProfileDraft.objectives.primary}
                            onValueChange={(value) => setCurrentProfileDraft({
                              ...currentProfileDraft,
                              objectives: { ...currentProfileDraft.objectives, primary: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minimize_makespan">Minimize Makespan</SelectItem>
                              <SelectItem value="maximize_throughput">Maximize Throughput</SelectItem>
                              <SelectItem value="minimize_cost">Minimize Cost</SelectItem>
                              <SelectItem value="minimize_tardiness">Minimize Tardiness</SelectItem>
                              <SelectItem value="maximize_utilization">Maximize Utilization</SelectItem>
                              <SelectItem value="minimize_inventory">Minimize Inventory</SelectItem>
                              <SelectItem value="balance_workload">Balance Workload</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-3">
                          <Label>Performance Trade-offs</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Speed vs Accuracy</span>
                              <span className="text-sm font-medium">{currentProfileDraft.objectives.tradeOffs.speedVsAccuracy}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={currentProfileDraft.objectives.tradeOffs.speedVsAccuracy}
                              onChange={(e) => setCurrentProfileDraft({
                                ...currentProfileDraft,
                                objectives: {
                                  ...currentProfileDraft.objectives,
                                  tradeOffs: {
                                    ...currentProfileDraft.objectives.tradeOffs,
                                    speedVsAccuracy: parseInt(e.target.value)
                                  }
                                }
                              })}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>More Accurate</span>
                              <span>Faster</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Feasibility vs Optimality</span>
                              <span className="text-sm font-medium">{currentProfileDraft.objectives.tradeOffs.feasibilityVsOptimality}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={currentProfileDraft.objectives.tradeOffs.feasibilityVsOptimality}
                              onChange={(e) => setCurrentProfileDraft({
                                ...currentProfileDraft,
                                objectives: {
                                  ...currentProfileDraft.objectives,
                                  tradeOffs: {
                                    ...currentProfileDraft.objectives.tradeOffs,
                                    feasibilityVsOptimality: parseInt(e.target.value)
                                  }
                                }
                              })}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>More Feasible</span>
                              <span>More Optimal</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Runtime Options */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Runtime Options</CardTitle>
                        <CardDescription>Configure execution parameters</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Max Execution Time (seconds)</Label>
                            <Input 
                              type="number" 
                              value={currentProfileDraft.runtimeOptions.maxExecutionTime}
                              onChange={(e) => setCurrentProfileDraft({
                                ...currentProfileDraft,
                                runtimeOptions: { 
                                  ...currentProfileDraft.runtimeOptions, 
                                  maxExecutionTime: parseInt(e.target.value) || 300 
                                }
                              })}
                            />
                          </div>
                          
                          <div>
                            <Label>Max Iterations</Label>
                            <Input 
                              type="number" 
                              value={currentProfileDraft.runtimeOptions.maxIterations || ''}
                              placeholder="Unlimited"
                              onChange={(e) => setCurrentProfileDraft({
                                ...currentProfileDraft,
                                runtimeOptions: { 
                                  ...currentProfileDraft.runtimeOptions, 
                                  maxIterations: parseInt(e.target.value) || undefined
                                }
                              })}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={currentProfileDraft.runtimeOptions.parallelProcessing}
                              onChange={(e) => setCurrentProfileDraft({
                                ...currentProfileDraft,
                                runtimeOptions: { 
                                  ...currentProfileDraft.runtimeOptions, 
                                  parallelProcessing: e.target.checked 
                                }
                              })}
                            />
                            Enable Parallel Processing
                          </Label>
                          
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={currentProfileDraft.runtimeOptions.incrementalMode}
                              onChange={(e) => setCurrentProfileDraft({
                                ...currentProfileDraft,
                                runtimeOptions: { 
                                  ...currentProfileDraft.runtimeOptions, 
                                  incrementalMode: e.target.checked 
                                }
                              })}
                            />
                            Incremental Mode (process changes only)
                          </Label>
                          
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={currentProfileDraft.runtimeOptions.warmStart}
                              onChange={(e) => setCurrentProfileDraft({
                                ...currentProfileDraft,
                                runtimeOptions: { 
                                  ...currentProfileDraft.runtimeOptions, 
                                  warmStart: e.target.checked 
                                }
                              })}
                            />
                            Warm Start (use previous solution)
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Constraints Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Constraint Management</CardTitle>
                        <CardDescription>Control how constraints are applied</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Constraint Strictness</Label>
                          <Select 
                            value={currentProfileDraft.constraints.strictness}
                            onValueChange={(value: any) => setCurrentProfileDraft({
                              ...currentProfileDraft,
                              constraints: { ...currentProfileDraft.constraints, strictness: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="relaxed">Relaxed (allow violations with penalties)</SelectItem>
                              <SelectItem value="moderate">Moderate (minimize violations)</SelectItem>
                              <SelectItem value="strict">Strict (no violations allowed)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Validation Rules Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Validation Rules
                      </h3>
                      {currentProfileDraft.validationRules ? (
                        <ValidationRulesSection 
                          validationRules={currentProfileDraft.validationRules}
                          onToggle={handleValidationRuleToggle}
                        />
                      ) : (
                        <Card className="p-4">
                          <div className="text-center text-gray-500">
                            <Shield className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No validation rules configured</p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-2"
                              onClick={() => {
                                const updatedProfile = { 
                                  ...currentProfileDraft, 
                                  validationRules: getDefaultValidationRules() 
                                };
                                setCurrentProfileDraft(updatedProfile);
                              }}
                            >
                              Initialize Default Rules
                            </Button>
                          </div>
                        </Card>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowProfileEditor(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => {
                          toast({ title: "Profile updated", description: "Runtime profile has been configured" });
                          setShowProfileEditor(false);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600"
                      >
                        Save Profile
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Examples Library Dialog */}
            <Dialog open={showExamplesLibrary} onOpenChange={setShowExamplesLibrary}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Algorithm Examples Library
                  </DialogTitle>
                  <DialogDescription>
                    Browse example algorithms to understand different optimization approaches
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Example 1: FIFO Scheduling */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">FIFO Scheduling</CardTitle>
                        <CardDescription>First In, First Out scheduling algorithm</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div><strong>Type:</strong> Simple Scheduling</div>
                          <div><strong>Best for:</strong> Fair processing, simple queues</div>
                          <div><strong>Pros:</strong> Easy to implement, predictable</div>
                          <div><strong>Cons:</strong> May not optimize for priorities</div>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => {
                            setShowExamplesLibrary(false);
                            startAISession('scheduling');
                          }}
                        >
                          Use as Template
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Example 2: EOQ Inventory */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">EOQ Inventory</CardTitle>
                        <CardDescription>Economic Order Quantity optimization</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div><strong>Type:</strong> Inventory Management</div>
                          <div><strong>Best for:</strong> Minimizing ordering costs</div>
                          <div><strong>Pros:</strong> Reduces total inventory costs</div>
                          <div><strong>Cons:</strong> Assumes constant demand</div>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => {
                            setShowExamplesLibrary(false);
                            startAISession('inventory');
                          }}
                        >
                          Use as Template
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Example 3: Bottleneck Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Bottleneck Analysis</CardTitle>
                        <CardDescription>Theory of Constraints optimization</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div><strong>Type:</strong> Capacity Optimization</div>
                          <div><strong>Best for:</strong> Identifying constraints</div>
                          <div><strong>Pros:</strong> Focuses on critical resources</div>
                          <div><strong>Cons:</strong> Requires accurate data</div>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => {
                            setShowExamplesLibrary(false);
                            startAISession('capacity');
                          }}
                        >
                          Use as Template
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Example 4: Least Setup Time */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Least Setup Time</CardTitle>
                        <CardDescription>Minimize changeover times between jobs</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div><strong>Type:</strong> Sequencing Optimization</div>
                          <div><strong>Best for:</strong> Reducing setup costs</div>
                          <div><strong>Pros:</strong> Increases throughput</div>
                          <div><strong>Cons:</strong> May delay urgent orders</div>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => {
                            setShowExamplesLibrary(false);
                            startAISession('sequencing');
                          }}
                        >
                          Use as Template
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </div>
        </div>



        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-2">
            {/* Desktop tabs - use scrollable horizontal layout */}
            <div className="hidden lg:block overflow-x-auto">
              <TabsList className="inline-flex h-10 items-center justify-start p-1 text-muted-foreground bg-muted rounded-md min-w-max">
                <TabsTrigger value="algorithms" className="whitespace-nowrap px-3 py-1.5 text-sm font-medium">
                  Algorithms
                </TabsTrigger>
                <TabsTrigger value="development" className="whitespace-nowrap px-3 py-1.5 text-sm font-medium">
                  Development
                </TabsTrigger>
                <TabsTrigger value="testing" className="whitespace-nowrap px-3 py-1.5 text-sm font-medium">
                  Testing
                </TabsTrigger>
                <TabsTrigger value="deployments" className="whitespace-nowrap px-3 py-1.5 text-sm font-medium">
                  Deployments
                </TabsTrigger>
                <TabsTrigger value="governance" className="whitespace-nowrap px-3 py-1.5 text-sm font-medium">
                  <Shield className="w-4 h-4 mr-2" />
                  Governance
                </TabsTrigger>
                <TabsTrigger value="approvals" className="whitespace-nowrap px-3 py-1.5 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approvals
                </TabsTrigger>
                <TabsTrigger value="versions" className="whitespace-nowrap px-3 py-1.5 text-sm font-medium">
                  <FileText className="w-4 h-4 mr-2" />
                  Versions
                </TabsTrigger>
                <TabsTrigger value="extensions" className="whitespace-nowrap px-3 py-1.5 text-sm font-medium">
                  Extensions
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Mobile/Tablet tabs - stacked layout */}
            <div className="lg:hidden">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 gap-1 mb-2">
                <TabsTrigger value="algorithms" className="px-2 py-2 text-xs font-medium">
                  Algorithms
                </TabsTrigger>
                <TabsTrigger value="development" className="px-2 py-2 text-xs font-medium">
                  Development
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 gap-1 mb-2">
                <TabsTrigger value="testing" className="px-2 py-2 text-xs font-medium">
                  Testing
                </TabsTrigger>
                <TabsTrigger value="deployments" className="px-2 py-2 text-xs font-medium">
                  Deployments
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 gap-1 mb-2">
                <TabsTrigger value="governance" className="px-2 py-2 text-xs font-medium">
                  <Shield className="w-3 h-3 mr-1" />
                  Gov
                </TabsTrigger>
                <TabsTrigger value="approvals" className="px-2 py-2 text-xs font-medium">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  App
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 gap-1">
                <TabsTrigger value="versions" className="px-2 py-2 text-xs font-medium">
                  <FileText className="w-3 h-3 mr-1" />
                  Ver
                </TabsTrigger>
                <TabsTrigger value="extensions" className="px-2 py-2 text-xs font-medium">
                  Ext
                </TabsTrigger>
              </TabsList>
            </div>
            
            {selectedTab === "algorithms" && (
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <div className="relative flex-1">
                  <Search 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" 
                  />
                  <Input
                    placeholder="Search algorithms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Search is already reactive, so just blur to remove focus
                        e.currentTarget.blur();
                      }
                    }}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <TabsContent value="algorithms" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <Card>
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Algorithms</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{filteredAlgorithms.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Standard</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{filteredAlgorithms.filter((a: OptimizationAlgorithm) => a.isStandard).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Deployed</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{filteredAlgorithms.filter((a: OptimizationAlgorithm) => a.status === 'deployed').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-2">
                    <TestTube className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">In Testing</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{filteredAlgorithms.filter((a: OptimizationAlgorithm) => a.status === 'testing').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtered Algorithm Results */}
            {(searchQuery || selectedCategory !== "all") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Search Results</h2>
                  <Badge variant="outline">{filteredAlgorithms.length} found</Badge>
                </div>
                {filteredAlgorithms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredAlgorithms.map((algorithm: OptimizationAlgorithm) => (
                      <AlgorithmCard key={algorithm.id} algorithm={algorithm} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center border-dashed">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No algorithms found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {searchQuery && selectedCategory !== "all" 
                        ? `No algorithms matching "${searchQuery}" in "${categories.find(c => c.value === selectedCategory)?.label}"`
                        : searchQuery 
                        ? `No algorithms matching "${searchQuery}"`
                        : `No algorithms in "${categories.find(c => c.value === selectedCategory)?.label}"`
                      }
                    </p>
                    {selectedCategory !== "all" && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setSelectedCategory("all")}
                      >
                        Clear Category Filter
                      </Button>
                    )}
                  </Card>
                )}
              </div>
            )}

            {/* Featured Algorithm - Show when no search/filter is active */}
            {!searchQuery && selectedCategory === "all" && filteredAlgorithms.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Featured Algorithm</h2>
                  <Badge variant="outline">{filteredAlgorithms[0]?.category?.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Badge>
                </div>
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-gray-800 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        if (filteredAlgorithms[0]?.name === 'backwards-scheduling') {
                          setShowBackwardsScheduling(true);
                        }
                      }}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base sm:text-lg text-blue-900 dark:text-blue-100">{filteredAlgorithms[0]?.displayName}</CardTitle>
                        <CardDescription className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                          {filteredAlgorithms[0]?.description}
                        </CardDescription>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 sm:ml-4">
                        <Badge className={`${getStatusColor(filteredAlgorithms[0]?.status)} text-white`}>
                          {filteredAlgorithms[0]?.status}
                        </Badge>
                        {filteredAlgorithms[0]?.isStandard && (
                          <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Standard
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-blue-700 dark:text-blue-300 mb-3">
                      <span>{filteredAlgorithms[0]?.category?.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                      <span>v{filteredAlgorithms[0]?.version}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs text-blue-700 dark:text-blue-200 mb-4">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>Optimized</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Performance</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Efficient</span>
                      </div>
                    </div>

                    {/* Algorithm Details */}
                    <div className="border-t border-blue-200 dark:border-blue-700 pt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                        <Settings className="w-4 h-4" />
                        <span>Algorithm Details</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Algorithm Type */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Type</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">{filteredAlgorithms[0]?.type?.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Optimization'}</p>
                        </div>

                        {/* Performance Metrics */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Performance</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-blue-200 dark:bg-blue-700 rounded-full h-2">
                              <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" style={{ width: `${filteredAlgorithms[0]?.performance?.score || 85}%` }} />
                            </div>
                            <span className="text-xs text-blue-700 dark:text-blue-300">{filteredAlgorithms[0]?.performance?.score || 85}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (filteredAlgorithms[0]?.name === 'backwards-scheduling') {
                          setShowBackwardsScheduling(true);
                        }
                      }}
                    >
                      Configure & Run Algorithm
                    </Button>
                </CardContent>
              </Card>
            </div>
            )}

            {/* Standard Algorithms Section */}
            {standardAlgorithms.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-semibold">Standard Algorithms</h2>
                  <Badge variant="outline">AI-Powered</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {standardAlgorithms.slice(0, 6).map((algorithm: OptimizationAlgorithm) => (
                    <AlgorithmCard key={algorithm.id} algorithm={algorithm} />
                  ))}
                </div>
              </div>
            )}

            {/* Custom Algorithms Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Custom Algorithms</h2>
                <Badge variant="outline">{filteredAlgorithms.filter((algo: OptimizationAlgorithm) => !algo.isStandard).length} custom</Badge>
              </div>
              
              {algorithmsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mt-2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredAlgorithms.filter((algo: OptimizationAlgorithm) => !algo.isStandard).length === 0 ? (
                <Card className="p-8 text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">No custom algorithms found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery || selectedCategory !== "all" 
                      ? "No custom algorithms match your search criteria"
                      : "Create your first custom optimization algorithm to get started"
                    }
                  </p>
                  <Button onClick={() => setShowAICreateDialog(true)} className="bg-gradient-to-r from-purple-500 to-pink-600">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredAlgorithms.filter((algo: OptimizationAlgorithm) => !algo.isStandard).map((algorithm: OptimizationAlgorithm) => (
                    <AlgorithmCard key={algorithm.id} algorithm={algorithm} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="development" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Algorithm Development & Improvement</h2>
              <Button onClick={() => setShowAICreateDialog(true)} className="bg-gradient-to-r from-purple-500 to-pink-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Create New Algorithm
              </Button>
            </div>

            {/* Development Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              
              {/* Algorithm Selection Panel */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="w-5 h-5" />
                      Select Algorithm
                    </CardTitle>
                    <CardDescription>
                      Choose an algorithm to review feedback and make improvements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {algorithms.length === 0 ? (
                      <div className="text-center py-4">
                        <Code2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">No algorithms available</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Create your first algorithm to get started</p>
                      </div>
                    ) : (
                      filteredAlgorithms.map((algorithm: OptimizationAlgorithm) => (
                        <div
                          key={algorithm.id}
                          onClick={() => setSelectedAlgorithmForDev(algorithm)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedAlgorithmForDev?.id === algorithm.id
                              ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{algorithm.displayName}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{algorithm.category}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={algorithm.status === 'deployed' ? 'default' : 'secondary'} className="text-xs">
                                  {algorithm.status}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">v{algorithm.version}</span>
                              </div>
                            </div>
                            {selectedAlgorithmForDev?.id === algorithm.id && (
                              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Feedback Statistics */}
                {selectedAlgorithmForDev && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Feedback Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Bug className="w-4 h-4 text-red-500" />
                          <div>
                            <p className="font-medium">{selectedAlgorithmFeedback.filter((f: any) => f.feedbackType === 'bug_report').length}</p>
                            <p className="text-xs text-gray-600">Bugs</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          <div>
                            <p className="font-medium">{selectedAlgorithmFeedback.filter((f: any) => f.feedbackType === 'improvement_suggestion').length}</p>
                            <p className="text-xs text-gray-600">Ideas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <div>
                            <p className="font-medium">{selectedAlgorithmFeedback.filter((f: any) => f.severity === 'critical' || f.severity === 'high').length}</p>
                            <p className="text-xs text-gray-600">Critical</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="font-medium">{selectedAlgorithmFeedback.filter((f: any) => f.feedbackType === 'positive_feedback').length}</p>
                            <p className="text-xs text-gray-600">Positive</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Feedback Review Panel */}
              <div className="lg:col-span-2">
                {!selectedAlgorithmForDev ? (
                  <Card className="p-8 text-center">
                    <Code2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select an Algorithm</h3>
                    <p className="text-gray-600 mb-4">
                      Choose an algorithm from the left panel to review user feedback and identify improvement opportunities
                    </p>
                    <Button onClick={() => setShowAICreateDialog(true)} className="bg-gradient-to-r from-purple-500 to-pink-600">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create New Algorithm Instead
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Algorithm Info & Controls */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Code2 className="w-5 h-5" />
                              {selectedAlgorithmForDev.displayName}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {selectedAlgorithmForDev.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={selectedAlgorithmForDev.status === 'deployed' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {selectedAlgorithmForDev.status}
                            </Badge>
                            <Badge variant="outline">v{selectedAlgorithmForDev.version}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
                            <SelectTrigger className="w-48">
                              <Filter className="w-4 h-4 mr-2" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Feedback</SelectItem>
                              <SelectItem value="bugs">Bug Reports</SelectItem>
                              <SelectItem value="improvements">Improvement Ideas</SelectItem>
                              <SelectItem value="critical">Critical Issues</SelectItem>
                              <SelectItem value="max">Max AI Feedback</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MessageSquare className="w-4 h-4" />
                            <span>{filteredFeedback.length} feedback items</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Feedback List */}
                    <div className="space-y-3">
                      {filteredFeedback.length === 0 ? (
                        <Card className="p-8 text-center">
                          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Feedback Yet</h3>
                          <p className="text-gray-600 mb-4">
                            {feedbackFilter === "all" 
                              ? "No user feedback has been submitted for this algorithm yet"
                              : `No ${feedbackFilter} feedback found for this algorithm`
                            }
                          </p>
                          <Button variant="outline" onClick={() => window.open('/feedback?tab=submit&type=algorithm', '_blank')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Feedback
                          </Button>
                        </Card>
                      ) : (
                        filteredFeedback.map((feedback: any) => (
                          <Card key={feedback.id} className="transition-all hover:shadow-md">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="flex-shrink-0">
                                    {getFeedbackIcon(feedback.feedbackType)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium">
                                        {/* Show Max indicator for automated feedback */}
                                        {(feedback.submittedBy === 9 || 
                                          (feedback.executionContext && feedback.executionContext.feedbackSource === "max_ai_assistant")) && (
                                          <span className="inline-flex items-center gap-1 mr-2">
                                            <Sparkles className="w-4 h-4 text-purple-600" />
                                            <span className="text-xs font-medium text-purple-600">MAX AI</span>
                                          </span>
                                        )}
                                        {feedback.title}
                                      </h4>
                                      <Badge className={`${getSeverityColor(feedback.severity)} text-white text-xs`}>
                                        {feedback.severity}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {feedback.category}
                                      </Badge>
                                      {/* Automated feedback badge */}
                                      {(feedback.submittedBy === 9 || 
                                        (feedback.executionContext && feedback.executionContext.feedbackSource === "max_ai_assistant")) && (
                                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                                          AUTOMATED
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      {feedback.description}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                      <span>Submitted {new Date(feedback.createdAt).toLocaleDateString()}</span>
                                      <span>•</span>
                                      <span>Status: {feedback.status}</span>
                                      {feedback.suggestedImprovement && (
                                        <>
                                          <span>•</span>
                                          <span className="text-blue-600">Has suggestion</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFeedbackExpansion(feedback.id)}
                                  className="flex-shrink-0"
                                >
                                  {expandedFeedback.has(feedback.id) ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </CardHeader>
                            
                            {expandedFeedback.has(feedback.id) && (
                              <CardContent className="pt-0">
                                <div className="space-y-4 pl-7">
                                  {feedback.expectedResult && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-1">Expected Result:</h5>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{feedback.expectedResult}</p>
                                    </div>
                                  )}
                                  {feedback.actualResult && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-1">Actual Result:</h5>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{feedback.actualResult}</p>
                                    </div>
                                  )}
                                  {feedback.suggestedImprovement && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                                        Suggested Improvement:
                                      </h5>
                                      <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">{feedback.suggestedImprovement}</p>
                                    </div>
                                  )}
                                  {feedback.reproductionSteps && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-1">Reproduction Steps:</h5>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{feedback.reproductionSteps}</p>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-2 pt-2 border-t">
                                    <Button size="sm" variant="outline">
                                      <ArrowRight className="w-3 h-3 mr-1" />
                                      Implement
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      Respond
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Mark Resolved
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Algorithm Testing</h2>
              <Button>
                <TestTube className="w-4 h-4 mr-2" />
                New Test
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tests.length === 0 ? (
                <Card className="p-8 text-center col-span-2">
                  <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tests configured</h3>
                  <p className="text-gray-600 mb-4">
                    Start testing your algorithms with real or example data
                  </p>
                  <Button>Create First Test</Button>
                </Card>
              ) : (
                tests.map((test: AlgorithmTest) => (
                  <Card key={test.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{test.testType}</Badge>
                        <Button size="sm">
                          <Play className="w-3 h-3 mr-1" />
                          Run
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="deployments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Active Deployments</h2>
              <Button>
                <Rocket className="w-4 h-4 mr-2" />
                Deploy Algorithm
              </Button>
            </div>
            
            <div className="space-y-4">
              {deployments.length === 0 ? (
                <Card className="p-8 text-center">
                  <Rocket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active deployments</h3>
                  <p className="text-gray-600 mb-4">
                    Deploy approved algorithms to production modules
                  </p>
                  <Button>Deploy First Algorithm</Button>
                </Card>
              ) : (
                deployments.map((deployment: AlgorithmDeployment) => (
                  <Card key={deployment.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Algorithm #{deployment.algorithmId}</CardTitle>
                          <CardDescription>{deployment.targetModule} - {deployment.environment}</CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(deployment.status)} text-white`}>
                          {deployment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          <span>v{deployment.version}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          <span>Health: OK</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Algorithm Governance Tab */}
          <TabsContent value="governance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Algorithm Governance Overview</h2>
              <div className="flex items-center gap-2">
                <Select value={selectedPlantId?.toString() || "all"} onValueChange={(value) => setSelectedPlantId(value === "all" ? null : Number(value))}>
                  <SelectTrigger className="w-[200px]">
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
              </div>
            </div>

            {/* Governance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Versions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{algorithmVersions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all algorithms
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {algorithmApprovals.filter((approval: any) => approval.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Deployments</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {governanceDeployments.filter((deployment: any) => deployment.status === 'active').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently running
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Algorithm Versions Tab */}
          <TabsContent value="versions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Algorithm Versions</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Version
              </Button>
            </div>

            <div className="grid gap-6">
              {algorithmVersions.map((version: AlgorithmVersion) => (
                <Card key={version.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{version.displayName}</CardTitle>
                        <CardDescription>{version.algorithmName} v{version.version}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={version.developmentStatus === 'approved' ? 'default' : 
                                 version.developmentStatus === 'testing' ? 'secondary' : 'outline'}
                        >
                          {version.developmentStatus}
                        </Badge>
                        <Badge variant="outline">{version.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {version.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{version.developedBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {version.algorithmType}
                      </Badge>
                    </div>

                    {version.releaseNotes && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                        <h5 className="text-sm font-medium mb-2">Release Notes</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {version.releaseNotes}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="w-3 h-3 mr-1" />
                        Clone Version
                      </Button>
                      {version.developmentStatus === 'approved' && (
                        <Button size="sm">
                          <Play className="w-3 h-3 mr-1" />
                          Request Approval
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {algorithmVersions.length === 0 && (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No algorithm versions found</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first algorithm version to get started
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Version
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Algorithm Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Plant Algorithm Approvals</h2>
              <div className="flex items-center gap-2">
                <Select value={selectedPlantId?.toString() || "all"} onValueChange={(value) => setSelectedPlantId(value === "all" ? null : Number(value))}>
                  <SelectTrigger className="w-[200px]">
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
                <Button onClick={() => setShowApprovalDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Approval Request
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {algorithmApprovals.map((approval: PlantAlgorithmApproval) => (
                <Card key={approval.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {approval.algorithmVersion?.displayName || `Algorithm Version ${approval.algorithmVersionId}`}
                        </CardTitle>
                        <CardDescription>
                          {approval.plant?.name || 'Unknown Plant'} • v{approval.algorithmVersion?.version || 'N/A'} • Priority {approval.priority}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={approval.status === 'approved' ? 'default' : 
                                 approval.status === 'pending' ? 'secondary' : 'destructive'}
                        >
                          {approval.status}
                        </Badge>
                        <Badge variant="outline">{approval.approvalLevel}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {approval.effectiveDate ? 
                            `Effective: ${new Date(approval.effectiveDate).toLocaleDateString()}` : 
                            'No effective date set'
                          }
                        </span>
                      </div>
                      {approval.approvedByUser && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>
                            {approval.approvedByUser.firstName} {approval.approvedByUser.lastName}
                          </span>
                        </div>
                      )}
                    </div>

                    {approval.approvalNotes && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                        <h5 className="text-sm font-medium mb-2">Approval Notes</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {approval.approvalNotes}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedApproval(approval)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      {approval.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => approveAlgorithmMutation.mutate({ approvalId: approval.id })}
                            disabled={approveAlgorithmMutation.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {approveAlgorithmMutation.isPending ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => rejectAlgorithmMutation.mutate({ approvalId: approval.id })}
                            disabled={rejectAlgorithmMutation.isPending}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            {rejectAlgorithmMutation.isPending ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </>
                      )}
                      {approval.status === 'approved' && (
                        <>
                          <Button size="sm">
                            <Play className="w-3 h-3 mr-1" />
                            Deploy
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => unapproveAlgorithmMutation.mutate({ approvalId: approval.id })}
                            disabled={unapproveAlgorithmMutation.isPending}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            {unapproveAlgorithmMutation.isPending ? 'Revoking...' : 'Revoke Approval'}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {algorithmApprovals.length === 0 && (
                <Card className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No approval requests found</h3>
                  <p className="text-gray-600 mb-4">
                    Submit algorithm versions for plant approval to get started
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Approval Request
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="extensions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Extension Data Management</h2>
              <Button>
                <Database className="w-4 h-4 mr-2" />
                Add Extension Field
              </Button>
            </div>
            
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Extension system ready</h3>
              <p className="text-gray-600 mb-4">
                Add custom data fields to jobs and resources for algorithm-specific requirements
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Fields
                </Button>
                <Button>
                  <Eye className="w-4 h-4 mr-2" />
                  View Data
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Algorithm Detail Dialog */}
      {selectedAlgorithm && (
        <Dialog open={!!selectedAlgorithm} onOpenChange={() => setSelectedAlgorithm(null)}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-lg sm:text-xl">{selectedAlgorithm.displayName}</span>
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(selectedAlgorithm.status)} text-white text-xs`}>
                    {selectedAlgorithm.status}
                  </Badge>
                  {selectedAlgorithm.isStandard && (
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Standard
                    </Badge>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription className="text-sm">{selectedAlgorithm.description}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Algorithm Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <strong>Category:</strong> {selectedAlgorithm.category.replace('_', ' ')}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedAlgorithm.type}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <strong>Version:</strong> {selectedAlgorithm.version}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(selectedAlgorithm.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Performance & Configuration */}
              {(selectedAlgorithm.performance || selectedAlgorithm.configuration) && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-base">Performance & Configuration</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedAlgorithm.performance && Object.keys(selectedAlgorithm.performance).length > 0 && (
                      <Card className="p-4">
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Performance Metrics
                        </h5>
                        <div className="space-y-1 text-sm">
                          {Object.entries(selectedAlgorithm.performance).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace('_', ' ')}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                    
                    {selectedAlgorithm.configuration && Object.keys(selectedAlgorithm.configuration).length > 0 && (
                      <Card className="p-4">
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Configuration
                        </h5>
                        <div className="space-y-1 text-sm">
                          {Object.entries(selectedAlgorithm.configuration).slice(0, 5).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace('_', ' ')}:</span>
                              <span className="font-medium truncate ml-2">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* How It Works */}
              <div className="space-y-3">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  How It Works
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <p><strong>Algorithm Type:</strong> {selectedAlgorithm.type}</p>
                    <p><strong>Category:</strong> {selectedAlgorithm.category.replace('_', ' ')}</p>
                    <p><strong>Description:</strong> {selectedAlgorithm.description}</p>
                    {selectedAlgorithm.configuration?.objective && (
                      <p><strong>Objective:</strong> {selectedAlgorithm.configuration.objective}</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedAlgorithm.algorithmCode && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Algorithm Implementation
                  </h4>
                  <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs sm:text-sm"><code>{selectedAlgorithm.algorithmCode}</code></pre>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-4 border-t sm:flex-row sm:justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto order-1 bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700"
                  onClick={() => {
                    setAlgorithmToModify(selectedAlgorithm);
                    setAiModifyMessages([{
                      role: 'assistant',
                      content: `I'll help you modify the "${selectedAlgorithm?.displayName}" algorithm. You can describe what changes you'd like to make, such as:\n\n• Adjust optimization parameters\n• Change algorithm logic\n• Modify constraints\n• Update performance settings\n• Add new features\n\nWhat would you like to modify?`
                    }]);
                    setShowAIModifyDialog(true);
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Modify
                </Button>
                <Button variant="outline" size="sm" className="w-full sm:w-auto order-2">
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
                <Button size="sm" className="w-full sm:w-auto order-3">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Algorithm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Algorithm Modification Dialog */}
      {showAIModifyDialog && algorithmToModify && (
        <Dialog open={showAIModifyDialog} onOpenChange={(open) => {
          setShowAIModifyDialog(open);
          if (!open) {
            setAiModifyMessages([]);
            setAiModifyPrompt("");
            setAlgorithmToModify(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Modify: {algorithmToModify.displayName}
              </DialogTitle>
              <DialogDescription>
                Use AI to modify the algorithm by describing your desired changes in natural language.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Algorithm Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {algorithmToModify.displayName}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {algorithmToModify.category}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {algorithmToModify.type}
                  </div>
                  <div>
                    <span className="font-medium">Version:</span> {algorithmToModify.version}
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-medium">Description:</span> {algorithmToModify.description}
                </div>
              </div>

              {/* Current Algorithm Code */}
              {algorithmToModify.algorithmCode && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Current Algorithm Code
                  </h4>
                  <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto max-h-40">
                    <pre className="text-xs"><code>{algorithmToModify.algorithmCode}</code></pre>
                  </div>
                </div>
              )}

              {/* AI Conversation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-2 rounded-t-lg">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-semibold text-sm">AI Conversation</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-b-lg p-4 min-h-[200px] max-h-60 overflow-y-auto space-y-3">
                  {aiModifyMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100'
                      }`}>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-2 rounded-t-lg">
                  <Edit3 className="w-4 h-4" />
                  <span className="font-semibold text-sm">Your Modification Request</span>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    id="ai-modify-prompt"
                    data-testid="textarea-ai-modify-prompt"
                    placeholder="Example: Increase the optimization speed by 20% and add a constraint for minimum resource utilization of 80%..."
                    value={aiModifyPrompt}
                    onChange={(e) => setAiModifyPrompt(e.target.value)}
                    className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-b-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-purple-500 dark:focus:border-purple-400"
                    rows={3}
                  />
                  <Button
                    data-testid="button-submit-ai-modify"
                    onClick={() => {
                      if (aiModifyPrompt.trim()) {
                        aiModifyAlgorithmMutation.mutate({
                          algorithmId: algorithmToModify.id,
                          modificationRequest: aiModifyPrompt
                        });
                      }
                    }}
                    disabled={!aiModifyPrompt.trim() || aiModifyAlgorithmMutation.isPending}
                    className="self-end"
                  >
                    {aiModifyAlgorithmMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Modifying...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Modify
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Quick suggestions:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "Optimize for speed over accuracy",
                    "Add constraint validation",
                    "Improve error handling",
                    "Add logging and monitoring",
                    "Increase iteration limit by 50%"
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setAiModifyPrompt(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Approval Request Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              New Approval Request
            </DialogTitle>
            <DialogDescription>
              Request approval for an algorithm to be used in a specific plant
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Algorithm Version</Label>
              <Select 
                value={newApprovalData.algorithmVersionId?.toString() || ""}
                onValueChange={(value) => setNewApprovalData(prev => ({ ...prev, algorithmVersionId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select algorithm version..." />
                </SelectTrigger>
                <SelectContent>
                  {algorithmVersions.map((version: any) => (
                    <SelectItem key={version.id} value={version.id.toString()}>
                      {version.displayName} v{version.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plant</Label>
              <Select 
                value={newApprovalData.plantId?.toString() || ""}
                onValueChange={(value) => setNewApprovalData(prev => ({ ...prev, plantId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plant..." />
                </SelectTrigger>
                <SelectContent>
                  {plants.map((plant: any) => (
                    <SelectItem key={plant.id} value={plant.id.toString()}>
                      {plant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Approval Level</Label>
              <Select 
                value={newApprovalData.approvalLevel || ""}
                onValueChange={(value) => setNewApprovalData(prev => ({ ...prev, approvalLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select approval level..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plant_manager">Plant Manager</SelectItem>
                  <SelectItem value="regional_director">Regional Director</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={newApprovalData.priority?.toString() || ""}
                onValueChange={(value) => setNewApprovalData(prev => ({ ...prev, priority: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">High Priority</SelectItem>
                  <SelectItem value="100">Medium Priority</SelectItem>
                  <SelectItem value="150">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea 
                placeholder="Additional context or requirements for this approval..."
                rows={3}
                value={newApprovalData.notes || ""}
                onChange={(e) => setNewApprovalData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowApprovalDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={() => createApprovalMutation.mutate({
                  ...newApprovalData,
                  algorithmVersionId: newApprovalData.algorithmVersionId!,
                  plantId: newApprovalData.plantId!,
                  priority: newApprovalData.priority!
                })}
                disabled={createApprovalMutation.isPending || !newApprovalData.algorithmVersionId || !newApprovalData.plantId || !newApprovalData.approvalLevel}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createApprovalMutation.isPending ? 'Creating...' : 'Create Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}