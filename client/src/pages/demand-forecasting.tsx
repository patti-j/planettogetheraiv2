import { Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DemandForecasting() {
  // Use the proxy URL that serves from the same domain
  const streamlitUrl = '/forecasting';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Demand Forecasting</h1>
        </div>
        <p className="text-muted-foreground">
          AI-powered demand prediction and forecasting analytics
        </p>
      </div>

      {/* Alert */}
      <div className="px-6 pb-4">
        <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
          <AlertCircle className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-900 dark:text-purple-100">
            Advanced AI algorithms analyze historical data, market trends, and external factors to predict future demand with high accuracy.
          </AlertDescription>
        </Alert>
      </div>

      {/* Embedded Streamlit App via Proxy */}
      <div className="flex-1 px-6 pb-6">
        <iframe
          src={streamlitUrl}
          className="w-full h-full border-2 border-purple-200 dark:border-purple-800 rounded-lg"
          title="Demand Forecasting Application"
          data-testid="iframe-forecasting-app"
          style={{
            minHeight: '600px',
          }}
        />
      </div>
    </div>
  );
}
