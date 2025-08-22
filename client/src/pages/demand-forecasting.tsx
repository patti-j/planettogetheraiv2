import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, Calendar, BarChart3, AlertCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DemandForecasting() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            Demand Forecasting
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered demand prediction and forecasting analytics
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          Run Forecast
        </Button>
      </div>

      <Alert className="border-purple-200 bg-purple-50">
        <AlertCircle className="h-4 w-4 text-purple-600" />
        <AlertDescription>
          Advanced AI algorithms analyze historical data, market trends, and external factors to predict future demand with high accuracy.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Forecast Accuracy
            </CardTitle>
            <CardDescription>Current model performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">94.2%</div>
            <p className="text-sm text-muted-foreground mt-2">
              MAPE: 5.8% | MAE: 142 units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Forecast Horizon
            </CardTitle>
            <CardDescription>Planning period coverage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12 Weeks</div>
            <p className="text-sm text-muted-foreground mt-2">
              Updated daily with rolling forecast
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Products Forecasted
            </CardTitle>
            <CardDescription>Active SKUs in model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2,847</div>
            <p className="text-sm text-muted-foreground mt-2">
              Across 15 product categories
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Models</CardTitle>
          <CardDescription>AI models and algorithms in use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Time Series Analysis</h3>
              <p className="text-sm text-muted-foreground">
                ARIMA, SARIMA, and Prophet models for seasonal patterns
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Machine Learning</h3>
              <p className="text-sm text-muted-foreground">
                XGBoost and LSTM neural networks for complex patterns
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">External Factors</h3>
              <p className="text-sm text-muted-foreground">
                Weather, holidays, promotions, and market trends integration
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Ensemble Methods</h3>
              <p className="text-sm text-muted-foreground">
                Combines multiple models for improved accuracy
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Forecast Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Forecast vs Actual chart visualization would appear here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}