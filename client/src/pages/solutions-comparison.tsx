import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, Package, Cpu, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonCategory {
  title: string;
  items: {
    feature: string;
    integrated: string | boolean;
    aps: string | boolean;
    oem: string | boolean;
  }[];
}

export default function SolutionsComparison() {
  const [, setLocation] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const comparisonData: ComparisonCategory[] = [
    {
      title: "Core Capabilities",
      items: [
        { feature: "Scope", integrated: "Full supply chain management + advanced planning & scheduling in one platform", aps: "Advanced planning & scheduling only", oem: "Advanced planning & scheduling only" },
        { feature: "Target Customer", integrated: "Mid-to-large manufacturers seeking a unified platform", aps: "Companies with ERP/SCM already in place but needing best-in-class APS", oem: "Enterprises buying a full OEM SCM suite" },
        { feature: "Supply Chain Visibility", integrated: "End-to-end control tower across procurement, inventory, production, logistics, and demand", aps: "Limited to production scheduling visibility; relies on external SCM for supply chain view", oem: "Limited to production scheduling visibility inside OEM SCM" },
      ]
    },
    {
      title: "Planning & Optimization",
      items: [
        { feature: "Master Production Scheduling (MPS)", integrated: true, aps: true, oem: true },
        { feature: "Production Planning", integrated: true, aps: true, oem: true },
        { feature: "Capacity Requirements Planning (CRP)", integrated: true, aps: true, oem: true },
        { feature: "Material Requirements Planning (MRP)", integrated: "Full MRP with inventory integration", aps: "Limited – typically handled by ERP", oem: "Handled by OEM ERP module" },
        { feature: "Concurrent Planning", integrated: "Yes – recalculates across supply, demand, capacity in real time", aps: "Optional – can support if integrated with ERP/SCM", oem: "Yes – within OEM SCM scope" },
        { feature: "Demand Forecasting", integrated: "AI-driven, multi-source forecasting", aps: "Not included – expects demand plan from ERP/SCM", oem: "Not included – demand handled by OEM SCM" },
        { feature: "Inventory Optimization", integrated: "AI-driven safety stock & reorder calculations", aps: "Not included – inventory decisions handled elsewhere", oem: "Not included – inventory decisions in OEM SCM" },
        { feature: "Finite Capacity Scheduling", integrated: true, aps: true, oem: true },
        { feature: "Constraint-Based Optimization", integrated: true, aps: true, oem: true },
        { feature: "AI-Optimized Sequencing", integrated: true, aps: true, oem: true },
        { feature: "Multi-Level BOM & Routing", integrated: true, aps: true, oem: true },
      ]
    },
    {
      title: "Analytics & Intelligence",
      items: [
        { feature: "What-If Scenario Planning", integrated: "AI-powered with full supply chain & production modeling", aps: "AI-powered with production-only modeling", oem: "AI-powered with production-only modeling" },
        { feature: "Digital Twin Simulation", integrated: "Full supply chain + production", aps: "Production network only", oem: "Production network only" },
        { feature: "Dynamic Rescheduling", integrated: "Automatic, across supply chain & production", aps: "Automatic, production only", oem: "Automatic, production only" },
        { feature: "Prescriptive AI Recommendations", integrated: "Yes – service, cost, inventory, production priorities", aps: "Yes – production efficiency only", oem: "Yes – production efficiency only" },
        { feature: "Trade-Off Analytics", integrated: "Multi-objective optimization (service, cost, inventory)", aps: "Production-focused trade-offs only", oem: "Production-focused trade-offs only" },
      ]
    },
    {
      title: "Integration & Collaboration",
      items: [
        { feature: "Integration Capabilities", integrated: "Pre-built connectors for ERP, MES, WMS, TMS, logistics, analytics", aps: "ERP/MES/WMS connectors; API-first for custom", oem: "Tight integration with OEM SCM & ERP modules" },
        { feature: "Data Fabric", integrated: "Yes – integrates structured & unstructured data across supply chain", aps: "Yes – production scheduling data model", oem: "Within OEM ecosystem" },
        { feature: "Collaboration Tools", integrated: "Supplier/customer portals, secure messaging, shared dashboards", aps: "Planner/scheduler collaboration, internal only", oem: "Planner/scheduler collaboration, internal only" },
        { feature: "Compliance & Sustainability", integrated: "ISO, FDA, REACH, ESG tracking", aps: false, oem: false },
      ]
    },
    {
      title: "Technology & Deployment",
      items: [
        { feature: "AI Assistants & Agents", integrated: "Natural language queries, autonomous agents for SCM + APS tasks", aps: "Natural language queries, autonomous agents for APS tasks", oem: "Natural language queries, autonomous agents for APS tasks" },
        { feature: "Deployment Options", integrated: "Cloud, on-premise, hybrid", aps: "Cloud, on-premise, hybrid", oem: "Typically follows OEM suite deployment model" },
        { feature: "Implementation Model", integrated: "Self-implement or with consultant", aps: "Self-implement or with consultant", oem: "OEM vendor/partner services" },
      ]
    }
  ];

  const renderCell = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <div className="flex justify-center">
          <Check className="h-5 w-5 text-green-600" />
        </div>
      ) : (
        <div className="flex justify-center">
          <X className="h-5 w-5 text-red-500" />
        </div>
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  const solutionCards = [
    {
      title: "SCM + APS",
      subtitle: "Full Integrated Suite",
      icon: Package,
      color: "blue",
      description: "Complete supply chain management with advanced planning & scheduling in one unified platform",
      bestFor: "Organizations seeking a unified, AI-driven SCM + APS platform with broad functional coverage"
    },
    {
      title: "APS",
      subtitle: "Non-OEM Solution",
      icon: Cpu,
      color: "green",
      description: "Best-in-class advanced planning & scheduling that integrates with your existing ERP/SCM",
      bestFor: "Companies that need advanced scheduling without replacing existing SCM"
    },
    {
      title: "OEM APS",
      subtitle: "Embedded Solution",
      icon: Building2,
      color: "purple",
      description: "Advanced planning & scheduling embedded within enterprise SCM suites",
      bestFor: "Large enterprises standardizing on an OEM SCM suite"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Solutions Comparison</h1>
            <p className="text-xl opacity-90">
              Find the right Advanced Planning & Scheduling solution for your manufacturing operations
            </p>
          </div>
        </div>
      </div>

      {/* Solution Cards */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {solutionCards.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
                    solution.color === "blue" && "bg-blue-100 dark:bg-blue-900",
                    solution.color === "green" && "bg-green-100 dark:bg-green-900",
                    solution.color === "purple" && "bg-purple-100 dark:bg-purple-900"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6",
                      solution.color === "blue" && "text-blue-600 dark:text-blue-400",
                      solution.color === "green" && "text-green-600 dark:text-green-400",
                      solution.color === "purple" && "text-purple-600 dark:text-purple-400"
                    )} />
                  </div>
                  <CardTitle className="text-xl">{solution.title}</CardTitle>
                  <Badge variant="secondary" className="w-fit">{solution.subtitle}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{solution.description}</p>
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Best For:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{solution.bestFor}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="container mx-auto px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Detailed Feature Comparison</CardTitle>
            <CardDescription>
              Click on category headers to expand/collapse details
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="text-left p-4 font-semibold text-gray-900 dark:text-gray-100 min-w-[200px]">
                      Capability
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-900 dark:text-gray-100 min-w-[250px]">
                      <div className="flex flex-col items-center">
                        <Package className="h-5 w-5 mb-1 text-blue-600" />
                        <span>Standalone SCM + APS</span>
                      </div>
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-900 dark:text-gray-100 min-w-[250px]">
                      <div className="flex flex-col items-center">
                        <Cpu className="h-5 w-5 mb-1 text-green-600" />
                        <span>Standalone APS</span>
                      </div>
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-900 dark:text-gray-100 min-w-[250px]">
                      <div className="flex flex-col items-center">
                        <Building2 className="h-5 w-5 mb-1 text-purple-600" />
                        <span>OEM APS</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((category, categoryIndex) => {
                    const isExpanded = expandedCategories.has(category.title);
                    return (
                      <React.Fragment key={categoryIndex}>
                        <tr 
                          className="border-b bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                          onClick={() => toggleCategory(category.title)}
                        >
                          <td colSpan={4} className="p-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {category.title}
                              </h3>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && category.items.map((item, itemIndex) => (
                          <tr key={itemIndex} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">
                              {item.feature}
                            </td>
                            <td className="p-4 text-center">
                              {renderCell(item.integrated)}
                            </td>
                            <td className="p-4 text-center">
                              {renderCell(item.aps)}
                            </td>
                            <td className="p-4 text-center">
                              {renderCell(item.oem)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Ready to Transform Your Manufacturing Operations?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Our AI-powered PlanetTogether platform offers the most comprehensive solution for manufacturers 
                seeking to optimize their entire supply chain and production operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={() => setLocation("/demo-tour")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Start Demo Tour
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/pricing")}
                >
                  View Pricing
                </Button>
                <Button 
                  size="lg"
                  variant="ghost"
                  onClick={() => setLocation("/login")}
                >
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}