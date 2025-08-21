import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, DollarSign, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export const StarterEditionCard: React.FC = () => {
  const [, setLocation] = useLocation();
  
  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-700 text-base sm:text-lg">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
          Starter Edition Available
        </CardTitle>
        <CardDescription className="text-sm">
          Get immediate access to the full-featured platform at an affordable price
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 sm:pt-6">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Our Starter Edition provides complete access to:
          </p>
          <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>AI-powered planning and scheduling</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Real-time optimization engine</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Complete production management</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Business intelligence dashboard</span>
            </li>
          </ul>
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700" 
            onClick={() => setLocation("/pricing")}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            View Starter Edition Pricing
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Contact sales for enterprise options
          </p>
        </div>
      </CardContent>
    </Card>
  );
};