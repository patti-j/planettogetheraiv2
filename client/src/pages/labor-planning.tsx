import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  Wrench,
  Plus,
  Edit,
  Save,
  X,
  CheckCircle,
  Star
} from "lucide-react";

export default function LaborPlanning() {
  const [selectedShift, setSelectedShift] = useState("day");
  const [selectedWeek, setSelectedWeek] = useState("current");
  const [editingCell, setEditingCell] = useState<{employeeId: number, skill: string} | null>(null);
  const [skillsMatrix, setSkillsMatrix] = useState<{[key: string]: {[key: string]: number}}>({});
  const [newSkillName, setNewSkillName] = useState("");
  const [showAddSkill, setShowAddSkill] = useState(false);

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

  // Available skills and resources that can be assigned
  const availableSkills = [
    "CNC Machining", "Quality Control", "Forklift Operation", "Assembly", 
    "Packaging", "Welding", "Brewing Operations", "Fermentation", 
    "Maintenance", "Electrical", "HVAC", "Safety Inspector", 
    "Lean Manufacturing", "Six Sigma", "Team Leadership", "Training"
  ];

  const availableResources = [
    "Brew Kettle 1", "Brew Kettle 2", "Fermentation Tank 1", "Fermentation Tank 2",
    "Packaging Line A", "Packaging Line B", "CNC Machine 1", "CNC Machine 2",
    "Quality Lab", "Forklift 1", "Forklift 2", "Welding Station", 
    "Assembly Station 1", "Assembly Station 2", "Maintenance Workshop"
  ];

  const employees = [
    { 
      id: 1, 
      name: "John Smith", 
      department: "Production",
      skills: ["CNC Machining", "Quality Control"], 
      shift: "day", 
      availability: "available",
      yearsExperience: 8,
      certifications: ["ISO 9001", "CNC Programming"]
    },
    { 
      id: 2, 
      name: "Sarah Johnson", 
      department: "Production",
      skills: ["Assembly", "Packaging"], 
      shift: "day", 
      availability: "available",
      yearsExperience: 5,
      certifications: ["Lean Six Sigma Yellow Belt"]
    },
    { 
      id: 3, 
      name: "Mike Chen", 
      department: "Logistics",
      skills: ["Forklift Operation", "Assembly"], 
      shift: "evening", 
      availability: "requested-off",
      yearsExperience: 12,
      certifications: ["Forklift License", "Safety Training"]
    },
    { 
      id: 4, 
      name: "Lisa Davis", 
      department: "Production",
      skills: ["CNC Machining", "Assembly"], 
      shift: "night", 
      availability: "available",
      yearsExperience: 6,
      certifications: ["CNC Programming", "Quality Control"]
    },
    { 
      id: 5, 
      name: "Tom Wilson", 
      department: "Quality",
      skills: ["Quality Control", "Packaging"], 
      shift: "day", 
      availability: "available",
      yearsExperience: 15,
      certifications: ["ISO 9001", "Lean Six Sigma Green Belt"]
    },
    { 
      id: 6, 
      name: "Maria Rodriguez", 
      department: "Brewing",
      skills: ["Brewing Operations", "Fermentation"], 
      shift: "day", 
      availability: "available",
      yearsExperience: 10,
      certifications: ["Master Brewer", "Quality Control"]
    },
    { 
      id: 7, 
      name: "James Taylor", 
      department: "Maintenance",
      skills: ["Maintenance", "Electrical"], 
      shift: "evening", 
      availability: "available",
      yearsExperience: 18,
      certifications: ["Electrical License", "HVAC Certification"]
    },
    { 
      id: 8, 
      name: "Anna Kim", 
      department: "Production",
      skills: ["Assembly", "Team Leadership"], 
      shift: "day", 
      availability: "available",
      yearsExperience: 9,
      certifications: ["Lean Manufacturing", "Leadership Training"]
    }
  ];

  // Initialize skills matrix with sample data
  const initialSkillsMatrix = employees.reduce((matrix, employee) => {
    matrix[employee.id] = {};
    [...availableSkills, ...availableResources].forEach(skill => {
      // Set proficiency levels based on employee skills (1-5 scale)
      if (employee.skills.includes(skill)) {
        matrix[employee.id][skill] = employee.yearsExperience > 10 ? 5 : 
                                     employee.yearsExperience > 5 ? 4 : 3;
      } else {
        matrix[employee.id][skill] = 0; // No proficiency
      }
    });
    return matrix;
  }, {} as {[key: string]: {[key: string]: number}});

  // Use initialized matrix if skillsMatrix state is empty
  const currentSkillsMatrix = Object.keys(skillsMatrix).length === 0 ? initialSkillsMatrix : skillsMatrix;

  // Helper functions for skills matrix
  const getProficiencyLabel = (level: number) => {
    switch (level) {
      case 0: return "None";
      case 1: return "Beginner";
      case 2: return "Basic";
      case 3: return "Intermediate";
      case 4: return "Advanced";
      case 5: return "Expert";
      default: return "None";
    }
  };

  const getProficiencyColor = (level: number) => {
    switch (level) {
      case 0: return "bg-gray-100 text-gray-600";
      case 1: return "bg-red-100 text-red-700";
      case 2: return "bg-orange-100 text-orange-700";
      case 3: return "bg-yellow-100 text-yellow-700";
      case 4: return "bg-blue-100 text-blue-700";
      case 5: return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const updateSkillProficiency = (employeeId: number, skill: string, level: number) => {
    setSkillsMatrix(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [skill]: level
      }
    }));
    setEditingCell(null);
  };

  const addNewSkill = () => {
    if (newSkillName.trim()) {
      availableSkills.push(newSkillName.trim());
      employees.forEach(employee => {
        setSkillsMatrix(prev => ({
          ...prev,
          [employee.id]: {
            ...prev[employee.id],
            [newSkillName.trim()]: 0
          }
        }));
      });
      setNewSkillName("");
      setShowAddSkill(false);
    }
  };

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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Skills & Resource Capability Matrix
                </div>
                <div className="flex gap-2">
                  {showAddSkill ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="New skill name"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        className="w-40"
                        onKeyPress={(e) => e.key === 'Enter' && addNewSkill()}
                      />
                      <Button size="sm" onClick={addNewSkill}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddSkill(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setShowAddSkill(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Proficiency Levels:</span>
                  {[0, 1, 2, 3, 4, 5].map(level => (
                    <Badge key={level} className={`text-xs ${getProficiencyColor(level)}`}>
                      {level}: {getProficiencyLabel(level)}
                    </Badge>
                  ))}
                </div>

                {/* Skills Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Star className="h-5 w-5 mr-2 text-blue-500" />
                      Skills Matrix
                      <span className="ml-2 text-sm text-gray-500 font-normal">(Scroll horizontally to see all skills →)</span>
                    </h3>
                    <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
                      <div className="min-w-max">
                        <table className="w-full border-collapse border border-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 p-3 text-left font-medium sticky left-0 bg-gray-50 z-10 min-w-[180px]">Employee</th>
                            <th className="border border-gray-200 p-2 text-center font-medium sticky left-[180px] bg-gray-50 z-10 min-w-[80px]">Dept</th>
                            {availableSkills.map((skill) => (
                              <th key={skill} className="border border-gray-200 p-2 text-center font-medium text-xs min-w-[80px]" style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}>
                                {skill}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50">
                              <td className="border border-gray-200 p-3 sticky left-0 bg-white z-10 hover:bg-gray-50 min-w-[180px]">
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">{employee.name}</div>
                                    <div className="text-xs text-gray-500">{employee.yearsExperience}yr exp • {employee.shift}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="border border-gray-200 p-2 text-center text-xs sticky left-[180px] bg-white z-10 hover:bg-gray-50 min-w-[80px]">
                                <Badge variant="outline" className="text-xs">
                                  {employee.department}
                                </Badge>
                              </td>
                              {availableSkills.map((skill) => {
                                const proficiency = currentSkillsMatrix[employee.id]?.[skill] || 0;
                                const isEditing = editingCell?.employeeId === employee.id && editingCell?.skill === skill;
                                
                                return (
                                  <td key={skill} className="border border-gray-200 p-1">
                                    {isEditing ? (
                                      <Select
                                        value={proficiency.toString()}
                                        onValueChange={(value) => updateSkillProficiency(employee.id, skill, parseInt(value))}
                                      >
                                        <SelectTrigger className="w-full h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {[0, 1, 2, 3, 4, 5].map(level => (
                                            <SelectItem key={level} value={level.toString()}>
                                              {level}: {getProficiencyLabel(level)}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <button
                                        className={`w-full h-8 text-xs rounded px-1 hover:opacity-80 transition-opacity ${getProficiencyColor(proficiency)}`}
                                        onClick={() => setEditingCell({ employeeId: employee.id, skill })}
                                      >
                                        {proficiency}
                                      </button>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Resources Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-green-500" />
                      Resource Capability Matrix
                      <span className="ml-2 text-sm text-gray-500 font-normal">(Scroll horizontally to see all resources →)</span>
                    </h3>
                    <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
                      <div className="min-w-max">
                      <table className="w-full border-collapse border border-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 p-3 text-left font-medium sticky left-0 bg-gray-50 z-10 min-w-[180px]">Employee</th>
                            <th className="border border-gray-200 p-2 text-center font-medium sticky left-[180px] bg-gray-50 z-10 min-w-[80px]">Dept</th>
                            {availableResources.map((resource) => (
                              <th key={resource} className="border border-gray-200 p-2 text-center font-medium text-xs min-w-[80px]" style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}>
                                {resource}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50">
                              <td className="border border-gray-200 p-3 sticky left-0 bg-white z-10 hover:bg-gray-50 min-w-[180px]">
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">{employee.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {employee.certifications.slice(0, 2).join(', ')}
                                      {employee.certifications.length > 2 && '...'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="border border-gray-200 p-2 text-center text-xs sticky left-[180px] bg-white z-10 hover:bg-gray-50 min-w-[80px]">
                                <Badge variant="outline" className="text-xs">
                                  {employee.department}
                                </Badge>
                              </td>
                              {availableResources.map((resource) => {
                                const proficiency = currentSkillsMatrix[employee.id]?.[resource] || 0;
                                const isEditing = editingCell?.employeeId === employee.id && editingCell?.skill === resource;
                                
                                return (
                                  <td key={resource} className="border border-gray-200 p-1">
                                    {isEditing ? (
                                      <Select
                                        value={proficiency.toString()}
                                        onValueChange={(value) => updateSkillProficiency(employee.id, resource, parseInt(value))}
                                      >
                                        <SelectTrigger className="w-full h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {[0, 1, 2, 3, 4, 5].map(level => (
                                            <SelectItem key={level} value={level.toString()}>
                                              {level}: {getProficiencyLabel(level)}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <button
                                        className={`w-full h-8 text-xs rounded px-1 hover:opacity-80 transition-opacity ${getProficiencyColor(proficiency)}`}
                                        onClick={() => setEditingCell({ employeeId: employee.id, skill: resource })}
                                      >
                                        {proficiency}
                                      </button>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Gap Summary */}
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                    Skills Gap Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skillsGaps.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{skill.skill}</span>
                            {skill.critical && (
                              <Badge variant="destructive" className="text-xs">Critical</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            Required: {skill.required} | Available: {skill.available}
                          </div>
                          <div className={`text-sm font-medium ${skill.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            Gap: {skill.gap > 0 ? `+${skill.gap}` : 'Met'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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