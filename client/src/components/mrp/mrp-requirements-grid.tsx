import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { MrpRequirement } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MrpRequirementsGridProps {
  requirements: MrpRequirement[];
  isLoading: boolean;
}

export function MrpRequirementsGrid({ requirements, isLoading }: MrpRequirementsGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const filteredRequirements = requirements.filter((req) => {
    const matchesSearch = !searchTerm || 
      req.itemId.toString().includes(searchTerm.toLowerCase());
    
    const matchesPeriod = selectedPeriod === "all" || 
      new Date(req.periodStartDate).toISOString().startsWith(selectedPeriod);
    
    return matchesSearch && matchesPeriod;
  });

  // Get unique periods for filtering
  const periods = [...new Set(requirements.map(req => 
    new Date(req.periodStartDate).toISOString().slice(0, 7) // YYYY-MM format
  ))].sort();

  const getQuantityTrend = (grossReq: string, netReq: string) => {
    const gross = parseFloat(grossReq);
    const net = parseFloat(netReq);
    
    if (net > gross * 0.8) return "high";
    if (net > 0) return "medium";
    return "low";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "high":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "medium":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default:
        return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading requirements...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Material Requirements
        </CardTitle>
        <CardDescription>
          Detailed material requirements by item and time period
        </CardDescription>
        
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
          
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Periods</option>
            {periods.map(period => (
              <option key={period} value={period}>
                {new Date(period + "-01").toLocaleDateString("en-US", { 
                  year: "numeric", 
                  month: "long" 
                })}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredRequirements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No requirements found for the selected criteria
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item ID</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Gross Requirement</TableHead>
                  <TableHead className="text-right">Scheduled Receipts</TableHead>
                  <TableHead className="text-right">Projected Available</TableHead>
                  <TableHead className="text-right">Net Requirement</TableHead>
                  <TableHead className="text-right">Planned Orders</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequirements.map((req) => {
                  const trend = getQuantityTrend(req.grossRequirement, req.netRequirement);
                  
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {req.itemId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {formatDate(new Date(req.periodStartDate))}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              to {formatDate(new Date(req.periodEndDate))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(req.grossRequirement).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(req.scheduledReceipts).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={parseFloat(req.projectedAvailable) < 0 ? "text-red-600" : ""}>
                          {parseFloat(req.projectedAvailable).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={parseFloat(req.netRequirement) > 0 ? "text-orange-600 font-medium" : ""}>
                          {parseFloat(req.netRequirement).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(req.plannedOrderReleases).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(trend)}
                          <Badge className={getTrendColor(trend)}>
                            {trend}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}