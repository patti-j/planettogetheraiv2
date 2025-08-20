import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FlaskConical, Calendar, RefreshCw, BarChart3 } from 'lucide-react';
import { useLocation } from 'wouter';
import BryntumSchedulerProDemo from '@/components/scheduler-pro/BryntumSchedulerProDemo';

export default function BryntumDemoPage() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/20"
            onClick={() => setLocation('/production-schedule')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schedule
          </Button>
          <Badge className="bg-white text-orange-600">
            <FlaskConical className="w-3 h-3 mr-1" />
            Test Environment
          </Badge>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Bryntum Scheduler Pro Demo
        </h1>
        <p className="text-orange-100 mt-1">
          Test data with 5 resources and sample operations
        </p>
      </div>

      {/* Info Card */}
      <Card className="m-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-orange-800 dark:text-orange-300">
            About This Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-orange-700 dark:text-orange-400">
              This page demonstrates Bryntum Scheduler Pro with test data:
            </p>
            <ul className="list-disc list-inside space-y-1 text-orange-600 dark:text-orange-500">
              <li>5 test resources (Resource 1-5)</li>
              <li>Multiple colored operations</li>
              <li>Drag and drop functionality</li>
              <li>Resource-centered timeline view</li>
              <li>Native Bryntum features</li>
            </ul>
            <div className="flex items-center gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline"
                className="border-orange-400 text-orange-600 hover:bg-orange-100"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh Demo
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="border-orange-400 text-orange-600 hover:bg-orange-100"
                onClick={() => setLocation('/bryntum-chart-demo')}
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                View Chart Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduler Demo */}
      <div className="flex-1 p-4">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <BryntumSchedulerProDemo height="100%" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}