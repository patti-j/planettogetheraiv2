import { useState } from "react";
import { Bot } from "lucide-react";
import { useMaxDock } from "@/contexts/MaxDockContext";
import AIAgent from "@/components/ai-agent";

export default function AIAssistant() {
  const { isMaxOpen } = useMaxDock();
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <AIAgent searchQuery={searchQuery} onSearchChange={setSearchQuery} />
    </div>
  );
}