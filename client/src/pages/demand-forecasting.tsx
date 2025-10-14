import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Sparkles, AlertCircle, Database, BarChart3, TrendingUp, Target, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function DemandForecasting() {
  const [isOpening, setIsOpening] = useState(false);

  // Fetch the forecasting service URL from the backend
  const { data: urlData, isLoading, error } = useQuery<{ url: string }>({
    queryKey: ['/api/forecasting-service-url'],
  });

  const streamlitUrl = urlData?.url || '';

  const handleOpenForecasting = () => {
    if (!streamlitUrl) return;
    
    setIsOpening(true);
    window.open(streamlitUrl, '_blank', 'noopener,noreferrer');
    
    // Reset the opening state after a brief delay
    setTimeout(() => setIsOpening(false), 1000);
  };

  const buttonDisabled = isLoading || !streamlitUrl || isOpening;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            Demand Forecasting
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered demand prediction and forecasting analytics
          </p>
        </div>
      </div>

      <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
        <AlertCircle className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-900 dark:text-purple-100">
          Advanced AI algorithms analyze historical data, market trends, and external factors to predict future demand with high accuracy.
        </AlertDescription>
      </Alert>

      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <CardTitle className="text-2xl">Launch Demand Forecasting Application</CardTitle>
          <CardDescription className="text-base">
            Multi-model forecasting system with SQL Server integration, hierarchical filtering, and persistent model caching
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="text-center py-8">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Unable to load forecasting service URL. Please try again later.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                size="lg"
                onClick={handleOpenForecasting}
                disabled={buttonDisabled}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg disabled:opacity-50"
                data-testid="button-launch-forecasting"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    Loading...
                  </>
                ) : isOpening ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-6 w-6 mr-3" />
                    Open Forecasting Application
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Opens in a new tab for the best experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold">SQL Server Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect directly to your SQL Server database with secure credentials
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Multiple AI Models</h3>
                  <p className="text-sm text-muted-foreground">
                    Random Forest, ARIMA, Prophet, NeuralProphet, and DeepAR
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Smart Caching</h3>
                  <p className="text-sm text-muted-foreground">
                    Persistent model caching for faster repeated forecasts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✓</span>
                Hierarchical filtering (Planning Area, Scenario Name)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✓</span>
                Multi-item selection with bulk forecasting
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✓</span>
                Interactive Plotly visualizations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✓</span>
                Confidence interval predictions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✓</span>
                Automated feature engineering
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✓</span>
                Light/Dark theme toggle
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold flex-shrink-0">
                  1
                </span>
                <div>
                  <strong>Launch the application</strong> using the button above
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold flex-shrink-0">
                  2
                </span>
                <div>
                  <strong>Connect to SQL Server</strong> with your database credentials (auto-loaded from environment)
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold flex-shrink-0">
                  3
                </span>
                <div>
                  <strong>Select your data</strong> by choosing table, columns, and applying filters
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold flex-shrink-0">
                  4
                </span>
                <div>
                  <strong>Generate forecasts</strong> using your preferred AI model and time horizon
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> Ensure your SQL Server credentials are configured in the environment variables (SQL_SERVER, SQL_DATABASE, SQL_USERNAME, SQL_PASSWORD) for automatic connection.
        </AlertDescription>
      </Alert>
    </div>
  );
}
