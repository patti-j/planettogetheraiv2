import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import KanbanBoard from "@/components/kanban-board";
import Sidebar from "@/components/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function KanbanPage() {
  const [view, setView] = useState<"jobs" | "operations">("jobs");

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [], isLoading: operationsLoading } = useQuery({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ["/api/resources"],
  });

  const { data: capabilities = [], isLoading: capabilitiesLoading } = useQuery({
    queryKey: ["/api/capabilities"],
  });

  const isLoading = jobsLoading || operationsLoading || resourcesLoading || capabilitiesLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Skeleton className="h-6 w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <div className="flex-1 p-4 bg-gray-100">
            <div className="flex space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-80 bg-gray-50 rounded-lg p-4">
                  <Skeleton className="h-6 w-24 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 h-full">
        <KanbanBoard
          jobs={jobs}
          operations={operations}
          resources={resources}
          capabilities={capabilities}
          view={view}
          onViewChange={setView}
        />
      </div>
    </div>
  );
}