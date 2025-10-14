import { useEffect } from 'react';
import { Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemandForecasting() {
  // Get the Streamlit app URL - port 8080 on the same domain
  const streamlitUrl = window.location.origin.replace(':5000', ':8080');
  
  const openStreamlit = () => {
    window.open(streamlitUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-16 w-16 text-purple-600" />
          </div>
          <CardTitle className="text-3xl">AI Demand Forecasting</CardTitle>
          <CardDescription className="text-lg mt-2">
            Multi-model forecasting system with SQL Server integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Features:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>ARIMA, Prophet, NeuralProphet, and DeepAR models</li>
              <li>SQL Server data integration</li>
              <li>Interactive forecasting visualization</li>
              <li>Model comparison and performance metrics</li>
            </ul>
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={openStreamlit} 
              className="w-full" 
              size="lg"
              data-testid="button-open-forecasting"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Open Forecasting Application
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-3">
              Opens in a new browser tab
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
