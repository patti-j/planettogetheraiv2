import AIAgent from "@/components/ai-agent";
import Sidebar from "@/components/sidebar";

export default function AIAssistant() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-6 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Max, your AI Assistant</h1>
            <p className="text-muted-foreground mt-2">
              Use voice commands or text to manage your manufacturing operations. 
              Try saying "Create a new job" or "Show me all pending operations".
            </p>
          </div>
          
          <AIAgent />
        </div>
      </main>
    </div>
  );
}