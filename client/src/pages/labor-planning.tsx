import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Star,
  Coffee,
  Home,
  Briefcase
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

export default function LaborPlanning() {
  const [selectedShift, setSelectedShift] = useState("day");
  const [selectedWeek, setSelectedWeek] = useState("current");
  const [editingCell, setEditingCell] = useState<{employeeId: number, skill: string} | null>(null);
  const [skillsMatrix, setSkillsMatrix] = useState<{[key: string]: {[key: string]: number}}>({});
  const [newSkillName, setNewSkillName] = useState("");
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

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

  // Generate weekly schedule for an employee
  const generateEmployeeSchedule = (employee: any) => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start on Monday
    const schedule = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dayName = format(date, 'EEEE');
      const isWeekend = i >= 5; // Saturday and Sunday
      
      // Generate shift info based on employee's shift type and day
      let shiftInfo = null;
      
      if (!isWeekend || (employee.shift === 'night' && i === 5)) { // Some night shift workers may work Saturday
        const shift = shiftData[employee.shift as keyof typeof shiftData];
        shiftInfo = {
          start: shift.start,
          end: shift.end,
          type: employee.shift,
          location: employee.department === 'Brewing' ? 'Brew House' : 
                    employee.department === 'Logistics' ? 'Warehouse' : 
                    employee.department === 'Quality' ? 'Lab' : 
                    employee.department === 'Maintenance' ? 'Shop Floor' : 
                    'Production Floor',
          tasks: getTasksForDay(employee, dayName),
          breaks: getBreaksForShift(employee.shift),
          overtime: (i === 2 || i === 3) && employee.shift === 'day' ? 2 : 0, // Some overtime on Tue/Wed for day shift
        };
      }
      
      schedule.push({
        date,
        dayName,
        isWeekend,
        isToday: isSameDay(date, new Date()),
        shift: shiftInfo,
        specialNotes: getSpecialNotes(employee, date, i),
      });
    }
    
    return schedule;
  };

  // Get tasks for a specific day
  const getTasksForDay = (employee: any, dayName: string) => {
    const baseTasks = employee.skills.map((skill: string) => {
      if (skill === 'CNC Machining') return 'Operate CNC machines, quality checks';
      if (skill === 'Quality Control') return 'Perform quality inspections, documentation';
      if (skill === 'Forklift Operation') return 'Material handling, warehouse operations';
      if (skill === 'Assembly') return 'Product assembly, line operations';
      if (skill === 'Packaging') return 'Packaging operations, labeling';
      if (skill === 'Brewing Operations') return 'Monitor brewing process, temperature control';
      if (skill === 'Fermentation') return 'Check fermentation tanks, sampling';
      if (skill === 'Maintenance') return 'Equipment maintenance, repairs';
      if (skill === 'Electrical') return 'Electrical systems check, troubleshooting';
      if (skill === 'Team Leadership') return 'Team coordination, shift handover';
      return 'Standard operations';
    });
    
    // Add day-specific tasks
    if (dayName === 'Monday') baseTasks.push('Weekly safety meeting');
    if (dayName === 'Friday') baseTasks.push('End-of-week reporting');
    
    return baseTasks;
  };

  // Get breaks for a shift
  const getBreaksForShift = (shift: string) => {
    if (shift === 'day') {
      return [
        { time: '09:00', duration: 15, type: 'Coffee Break' },
        { time: '11:30', duration: 30, type: 'Lunch' },
      ];
    } else if (shift === 'evening') {
      return [
        { time: '17:00', duration: 15, type: 'Coffee Break' },
        { time: '19:00', duration: 30, type: 'Dinner' },
      ];
    } else {
      return [
        { time: '01:00', duration: 15, type: 'Coffee Break' },
        { time: '03:00', duration: 30, type: 'Meal Break' },
      ];
    }
  };

  // Get special notes for a day
  const getSpecialNotes = (employee: any, date: Date, dayIndex: number) => {
    const notes = [];
    
    if (employee.availability === 'requested-off' && dayIndex === 4) {
      notes.push('Requested time off - pending approval');
    }
    
    if (dayIndex === 0) {
      notes.push('Department meeting at shift start');
    }
    
    if (employee.certifications.includes('ISO 9001') && dayIndex === 2) {
      notes.push('ISO audit participation required');
    }
    
    if (employee.skills.includes('Team Leadership') && dayIndex === 1) {
      notes.push('Lead morning briefing');
    }
    
    return notes;
  };

  // Handle view schedule click
  const handleViewSchedule = (employee: any) => {
    setSelectedEmployee(employee);
    setScheduleDialogOpen(true);
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewSchedule(employee)}
                    >
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

      {/* Employee Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Weekly Schedule - {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.department} Department | {selectedEmployee?.shift} Shift | Week of {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-4 mt-4">
              {/* Employee Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-medium">#{selectedEmployee.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="font-medium">{selectedEmployee.yearsExperience} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Certifications</p>
                    <p className="font-medium">{selectedEmployee.certifications.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Availability</p>
                    <Badge 
                      variant={selectedEmployee.availability === "available" ? "default" : "secondary"}
                    >
                      {selectedEmployee.availability.replace("-", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Weekly Schedule Grid */}
              <div className="space-y-3">
                {generateEmployeeSchedule(selectedEmployee).map((day, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-4 ${
                      day.isToday ? 'border-blue-500 bg-blue-50/50' : 
                      day.isWeekend ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-semibold ${day.isToday ? 'text-blue-600' : ''}`}>
                          {day.dayName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {format(day.date, 'MMM dd')}
                        </div>
                        {day.isToday && (
                          <Badge variant="default" className="text-xs">Today</Badge>
                        )}
                        {day.isWeekend && !day.shift && (
                          <Badge variant="outline" className="text-xs">
                            <Home className="w-3 h-3 mr-1" />
                            Day Off
                          </Badge>
                        )}
                      </div>
                      {day.shift && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {day.shift.start} - {day.shift.end}
                            {day.shift.overtime > 0 && ` (+${day.shift.overtime}h OT)`}
                          </span>
                        </div>
                      )}
                    </div>

                    {day.shift ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium">Location:</span>
                              <span className="text-sm">{day.shift.location}</span>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-1">Tasks:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {day.shift.tasks.map((task: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-gray-400">•</span>
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium mb-1 flex items-center gap-2">
                                <Coffee className="w-4 h-4 text-gray-500" />
                                Breaks:
                              </p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {day.shift.breaks.map((breakItem: any, i: number) => (
                                  <li key={i}>
                                    {breakItem.time} - {breakItem.type} ({breakItem.duration} min)
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {day.specialNotes.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                  Notes:
                                </p>
                                <ul className="text-xs text-yellow-700 space-y-1">
                                  {day.specialNotes.map((note: string, i: number) => (
                                    <li key={i} className="flex items-start gap-1">
                                      <span className="text-yellow-600">!</span>
                                      {note}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Home className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Enjoy your day off!</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Schedule Summary */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-xl font-semibold">
                      {generateEmployeeSchedule(selectedEmployee)
                        .filter(d => d.shift)
                        .reduce((total, day) => {
                          if (day.shift) {
                            const start = new Date(`2024-01-01 ${day.shift.start}`);
                            const end = new Date(`2024-01-01 ${day.shift.end}`);
                            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                            return total + hours + (day.shift.overtime || 0);
                          }
                          return total;
                        }, 0)} hours
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Overtime Hours</p>
                    <p className="text-xl font-semibold">
                      {generateEmployeeSchedule(selectedEmployee)
                        .reduce((total, day) => total + (day.shift?.overtime || 0), 0)} hours
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Working Days</p>
                    <p className="text-xl font-semibold">
                      {generateEmployeeSchedule(selectedEmployee)
                        .filter(d => d.shift).length} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Schedule
                </Button>
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Schedule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}