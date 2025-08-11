import { ReactNode, useState } from "react";
import TopMenu from "@/components/top-menu";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [maxCommand, setMaxCommand] = useState("");
  const { setMaxOpen, setCanvasVisible } = useMaxDock();
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest("/api/ai-agent/chat", {
        method: "POST",
        body: { message }
      });
    },
    onSuccess: (data) => {
      // Open Max panel to show response
      setMaxOpen(true);
      // Show canvas if AI returns visual content
      if (data?.showCanvas) {
        setCanvasVisible(true);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message to Max. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleMaxCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && maxCommand.trim()) {
      sendMessageMutation.mutate(maxCommand);
      setMaxCommand("");
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed mobile header - always visible */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm" style={{ zIndex: 2147483646 }}>
        <div className="flex items-center gap-3 px-4 py-2">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img 
              src="/attached_assets/Logo PlanetTogether 2-Jul-26-2024-03-56-49-3830-PM_1754504742070.png" 
              alt="PlanetTogether" 
              className="h-8 w-8 object-contain"
            />
          </div>
          
          {/* Max Search/Command Input */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Ask Max anything..."
              value={maxCommand}
              onChange={(e) => setMaxCommand(e.target.value)}
              onKeyDown={handleMaxCommand}
              className="pl-12 pr-4 h-9 text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>
      </div>
      
      {/* Main content area - scrollable with padding for header and footer */}
      <div className="flex-1 overflow-y-auto pt-14 pb-16">
        {children}
      </div>
      
      {/* Fixed mobile footer bar - always the same on every page */}
      <div className="fixed bottom-0 left-0 right-0" style={{ zIndex: 2147483647 }}>
        <TopMenu />
      </div>
    </div>
  );
}