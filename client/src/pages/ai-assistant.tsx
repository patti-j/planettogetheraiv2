import AIAgent from "@/components/ai-agent";

export default function AIAssistant() {
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Max, your AI Assistant</h1>
          <p className="text-sm md:text-base text-gray-600">
            Use voice commands or text to manage your manufacturing operations. 
            Try saying "Create a new job" or "Show me all pending operations".
          </p>
        </div>
      </div>
      
      <AIAgent />
    </div>
  );
}