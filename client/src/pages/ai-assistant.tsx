import { useState } from "react";
import { Bot } from "lucide-react";
import { useMaxDock } from "@/contexts/MaxDockContext";
import AIAgent from "@/components/ai-agent";

export default function AIAssistant() {
  const { isMaxOpen } = useMaxDock();
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="p-0 sm:p-6 space-y-0 sm:space-y-6 h-screen sm:h-auto">
      <div className="md:ml-12 ml-0 h-full">
        <AIAgent searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </div>
    </div>
  );
}