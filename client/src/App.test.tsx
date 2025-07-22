import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Minimal test component to check if basic React rendering works
function TestApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-4">
        <h1 className="text-2xl font-bold">PlanetTogether Test</h1>
        <p>If you can see this, React is working!</p>
      </div>
    </QueryClientProvider>
  );
}

export default TestApp;