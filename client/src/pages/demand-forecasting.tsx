import { useEffect } from 'react';

export default function DemandForecasting() {
  useEffect(() => {
    // Redirect to the Streamlit app served via proxy
    // This provides a seamless full-page experience similar to the Production Scheduler
    window.location.href = '/forecasting';
  }, []);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground">Loading Demand Forecasting...</p>
      </div>
    </div>
  );
}
