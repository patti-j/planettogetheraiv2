import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Factory, 
  Users,
  Package,
  Zap,
  ArrowRight,
  Check,
  Sparkles
} from "lucide-react";

const ROICalculator: React.FC = () => {
  const [annualRevenue, setAnnualRevenue] = useState(10000000);
  const [employeeCount, setEmployeeCount] = useState(100);
  const [productionVolume, setProductionVolume] = useState(50000);
  const [currentEfficiency, setCurrentEfficiency] = useState(70);
  
  // Calculate ROI based on inputs
  const calculateROI = () => {
    const efficiencyGain = 0.30; // 30% efficiency improvement
    const costReduction = 0.25; // 25% cost reduction
    const inventoryReduction = 0.35; // 35% inventory reduction
    const qualityImprovement = 0.40; // 40% quality improvement
    
    const annualCostSavings = annualRevenue * 0.15 * costReduction;
    const efficiencySavings = (annualRevenue * 0.40) * efficiencyGain;
    const inventorySavings = (annualRevenue * 0.10) * inventoryReduction;
    const qualitySavings = (annualRevenue * 0.05) * qualityImprovement;
    
    const totalSavings = annualCostSavings + efficiencySavings + inventorySavings + qualitySavings;
    const implementationCost = employeeCount * 499 * 12; // Annual cost
    const netROI = totalSavings - implementationCost;
    const paybackMonths = implementationCost / (totalSavings / 12);
    const roiPercentage = (netROI / implementationCost) * 100;
    
    return {
      totalSavings: Math.round(totalSavings),
      implementationCost: Math.round(implementationCost),
      netROI: Math.round(netROI),
      paybackMonths: Math.round(paybackMonths),
      roiPercentage: Math.round(roiPercentage),
      breakdown: {
        costSavings: Math.round(annualCostSavings),
        efficiencySavings: Math.round(efficiencySavings),
        inventorySavings: Math.round(inventorySavings),
        qualitySavings: Math.round(qualitySavings)
      }
    };
  };
  
  const roi = calculateROI();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <Badge className="mb-3 sm:mb-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
          ROI Calculator
        </Badge>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">
          Calculate Your Manufacturing ROI
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
          See how much you can save with PlanetTogether's AI-powered optimization
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Input Section */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Factory className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Your Manufacturing Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Annual Revenue */}
            <div className="space-y-2">
              <Label htmlFor="revenue" className="text-sm sm:text-base font-semibold">
                Annual Revenue
              </Label>
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="revenue"
                  type="number"
                  value={annualRevenue}
                  onChange={(e) => setAnnualRevenue(Number(e.target.value))}
                  className="text-base sm:text-lg font-semibold"
                />
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                ${formatNumber(annualRevenue)}
              </div>
            </div>

            {/* Employee Count */}
            <div className="space-y-2">
              <Label htmlFor="employees" className="text-sm sm:text-base font-semibold">
                Production Employees: {employeeCount}
              </Label>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <Slider
                  id="employees"
                  min={10}
                  max={1000}
                  step={10}
                  value={[employeeCount]}
                  onValueChange={(value) => setEmployeeCount(value[0])}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Production Volume */}
            <div className="space-y-2">
              <Label htmlFor="volume" className="text-sm sm:text-base font-semibold">
                Monthly Production Volume: {formatNumber(productionVolume)} units
              </Label>
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <Slider
                  id="volume"
                  min={1000}
                  max={500000}
                  step={1000}
                  value={[productionVolume]}
                  onValueChange={(value) => setProductionVolume(value[0])}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Current Efficiency */}
            <div className="space-y-2">
              <Label htmlFor="efficiency" className="text-sm sm:text-base font-semibold">
                Current Efficiency: {currentEfficiency}%
              </Label>
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <Slider
                  id="efficiency"
                  min={30}
                  max={90}
                  step={5}
                  value={[currentEfficiency]}
                  onValueChange={(value) => setCurrentEfficiency(value[0])}
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                Your Projected ROI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-lg">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                    {roi.roiPercentage}%
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Annual ROI</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-lg">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                    {roi.paybackMonths}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Months Payback</div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm sm:text-base">Total Annual Savings</span>
                  <span className="font-bold text-base sm:text-lg text-green-600">
                    {formatCurrency(roi.totalSavings)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm sm:text-base">Implementation Cost</span>
                  <span className="font-semibold text-base sm:text-lg">
                    {formatCurrency(roi.implementationCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm sm:text-base font-semibold">Net Annual Benefit</span>
                  <span className="font-bold text-lg sm:text-xl text-green-600">
                    {formatCurrency(roi.netROI)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Savings Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span className="text-xs sm:text-sm">Cost Reduction</span>
                  </div>
                  <span className="text-sm sm:text-base font-semibold">
                    {formatCurrency(roi.breakdown.costSavings)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span className="text-xs sm:text-sm">Efficiency Gains</span>
                  </div>
                  <span className="text-sm sm:text-base font-semibold">
                    {formatCurrency(roi.breakdown.efficiencySavings)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span className="text-xs sm:text-sm">Inventory Optimization</span>
                  </div>
                  <span className="text-sm sm:text-base font-semibold">
                    {formatCurrency(roi.breakdown.inventorySavings)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span className="text-xs sm:text-sm">Quality Improvement</span>
                  </div>
                  <span className="text-sm sm:text-base font-semibold">
                    {formatCurrency(roi.breakdown.qualitySavings)}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <Button 
                className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                size="lg"
                onClick={() => window.location.href = '/pricing'}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Get Started & Save {formatCurrency(roi.netROI)}/year
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;