import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Settings, 
  UserCheck,
  BarChart3,
  Target,
  Wrench
} from "lucide-react";

export default function LaborPlanning() {
  const [selectedShift, setSelectedShift] = useState("day");
  const [selectedWeek, setSelectedWeek] = useState("current");

  // Mock data for labor planning
  const shiftData = {
    day: { start: "06:00", end: "14:00", required: 12, assigned: 10, available: 8 },
    evening: { start: "14:00", end: "22:00", required: 8, assigned: 6, available: 5 },
    night: { start: "22:00", end: "06:00", required: 4, assigned: 3, available: 2 }
  };

  const skillsGaps = [
    { skill: "CNC Machining", required: 6, available: 4, gap: 2, critical: true },
    { skill: "Quality Control", required: 3, available: 3, gap: 0, critical: false },
    { skill: "Forklift Operation", required: 4, available: 2, gap: 2, critical: true },
    { skill: "Assembly", required: 8, available: 6, gap: 2, critical: false },
    { skill: "Packaging", required: 5, available: 5, gap: 0, critical: false }
  ];

  const employees = [
    { id: 1, name: "John Smith", skills: ["CNC Machining", "Quality Control"], shift: "day", availability: "available" },
    { id: 2, name: "Sarah Johnson", skills: ["Assembly", "Packaging"], shift: "day", availability: "available" },
    { id: 3, name: "Mike Chen", skills: ["Forklift Operation", "Assembly"], shift: "evening", availability: "requested-off" },
    { id: 4, name: "Lisa Davis", skills: ["CNC Machining", "Assembly"], shift: "night", availability: "available" },
    { id: 5, name: "Tom Wilson", skills: ["Quality Control", "Packaging"], shift: "day", availability: "available" }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Labor Planning & Workforce Optimization</h1>
          <p className="text-gray-600 mt-2">
            Optimize workforce allocation aligned with production capacity and employee preferences
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Optimization Settings
          </Button>
          <Button>
            <Target className="h-4 w-4 mr-2" />
            Run Optimization
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workforce</p>
                <p className="text-2xl font-bold">87</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Capacity Utilization</p>
                <p className="text-2xl font-bold">82%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Skill Gaps</p>
                <p className="text-2xl font-bold text-red-600">4</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Schedule Efficiency</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="capacity-planning" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capacity-planning">Capacity Planning</TabsTrigger>
          <TabsTrigger value="skills-matrix">Skills Matrix</TabsTrigger>
          <TabsTrigger value="employee-schedules">Employee Schedules</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Results</TabsTrigger>
        </TabsList>

        <TabsContent value="capacity-planning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Shift Capacity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(shiftData).map(([shift, data]) => (
                  <Card key={shift} className={`border ${selectedShift === shift ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold capitalize">{shift} Shift</h3>
                          <Badge variant={data.assigned >= data.required ? "default" : "destructive"}>
                            {data.assigned >= data.required ? "Adequate" : "Short Staffed"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{data.start} - {data.end}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Required: {data.required}</span>
                            <span>Assigned: {data.assigned}</span>
                          </div>
                          <Progress value={(data.assigned / data.required) * 100} className="w-full" />
                          <p className="text-sm text-gray-600">Available: {data.available}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills-matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Skills Gap Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillsGaps.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{skill.skill}</h3>
                        {skill.critical && (
                          <Badge variant="destructive" className="text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Required: {skill.required}</span>
                          <span>Available: {skill.available}</span>
                          <span className={skill.gap > 0 ? "text-red-600" : "text-green-600"}>
                            Gap: {skill.gap > 0 ? `+${skill.gap}` : skill.gap}
                          </span>
                        </div>
                        <Progress 
                          value={(skill.available / skill.required) * 100} 
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employee-schedules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="h-5 w-5 mr-2" />
                Employee Schedule Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{employee.name}</h3>
                        <Badge variant="outline">{employee.shift} shift</Badge>
                        <Badge 
                          variant={employee.availability === "available" ? "default" : "secondary"}
                        >
                          {employee.availability.replace("-", " ")}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Skills: {employee.skills.join(", ")}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Schedule
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Optimization Studio Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Current Schedule Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Capacity Utilization</span>
                        <span className="font-medium">82%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Schedule Efficiency</span>
                        <span className="font-medium">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employee Satisfaction</span>
                        <span className="font-medium">87%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Optimized Schedule Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Capacity Utilization</span>
                        <span className="font-medium text-green-600">96%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Schedule Efficiency</span>
                        <span className="font-medium text-green-600">98%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employee Satisfaction</span>
                        <span className="font-medium text-green-600">91%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Recommended Actions</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Cross-train 2 employees in CNC Machining</p>
                        <p className="text-sm text-gray-600">Reduces critical skill gap and improves flexibility</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Adjust evening shift start time to 13:30</p>
                        <p className="text-sm text-gray-600">Better coverage during peak production hours</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Implement flexible scheduling for packaging team</p>
                        <p className="text-sm text-gray-600">Improves employee satisfaction while maintaining coverage</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}