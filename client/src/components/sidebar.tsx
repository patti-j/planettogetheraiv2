import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Factory, Briefcase, ServerCog, BarChart3, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import JobForm from "./job-form";
import ResourceForm from "./resource-form";
import type { Capability } from "@shared/schema";

export default function Sidebar() {
  const [location] = useLocation();
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);

  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"],
  });

  const navigationItems = [
    { icon: BarChart3, label: "Schedule View", href: "/", active: location === "/" },
    { icon: Briefcase, label: "Jobs", href: "/jobs", active: location === "/jobs" },
    { icon: ServerCog, label: "Resources", href: "/resources", active: location === "/resources" },
    { icon: BarChart3, label: "Analytics", href: "/analytics", active: location === "/analytics" },
    { icon: FileText, label: "Reports", href: "/reports", active: location === "/reports" },
  ];

  return (
    <>
      <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center">
            <Factory className="text-primary mr-2" size={24} />
            Production Scheduler Pro
          </h1>
        </div>
        
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  item.active
                    ? "text-gray-700 bg-blue-50 border-l-4 border-primary"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </a>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 mt-8">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              className="w-full bg-primary hover:bg-blue-700 text-white"
              onClick={() => setJobDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
            <Button 
              className="w-full bg-accent hover:bg-green-600 text-white"
              onClick={() => setResourceDialogOpen(true)}
            >
              <ServerCog className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </div>
        </div>
      </aside>

      {/* Job Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          <JobForm onSuccess={() => setJobDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <ResourceForm 
            capabilities={capabilities} 
            onSuccess={() => setResourceDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
