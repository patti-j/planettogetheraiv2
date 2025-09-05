import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Link, Users, Settings, Wrench, Building } from 'lucide-react';

export default function ResourceCapabilityDiagram() {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Resource Capability Matrix Database Structure</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Database tables that populate the Labor Planning Resource Capability Matrix
          </p>
        </div>

        {/* Main Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employees Table */}
          <Card className="border-blue-500 border-2">
            <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                employees
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Fields:</div>
                <div className="pl-2 space-y-1">
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">id</span> (PK)</div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">employeeNumber</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">firstName</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">lastName</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">departmentId</span> (FK)</div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">jobTitle</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">skillLevel</span></div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1 rounded">
                    <span className="font-mono bg-yellow-200 dark:bg-yellow-800 px-1 rounded">capabilities</span> 
                    <span className="text-xs ml-1">(JSONB array of capability IDs)</span>
                  </div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">isResource</span></div>
                </div>
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  Stores employee data including their skill capabilities as an array of capability IDs
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PT Resources Table */}
          <Card className="border-green-500 border-2">
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                ptResources
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Fields:</div>
                <div className="pl-2 space-y-1">
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">id</span> (PK)</div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">resourceId</span> (PT ID)</div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">name</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">description</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">externalId</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">resourceType</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">plantId</span> (FK)</div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">departmentId</span> (FK)</div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">capacity</span></div>
                </div>
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                  PlanetTogether resources: machines, equipment, workstations, tools
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PT Capabilities Table */}
          <Card className="border-purple-500 border-2">
            <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-purple-600" />
                ptCapabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Fields:</div>
                <div className="pl-2 space-y-1">
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">id</span> (PK)</div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">capabilityId</span> (PT ID)</div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">name</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">description</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">notes</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">externalId</span></div>
                </div>
                <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs">
                  Master list of all capabilities/skills (CNC Machining, Welding, Quality Control, etc.)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Junction Table */}
        <div className="flex justify-center">
          <Card className="border-orange-500 border-2 w-full max-w-2xl">
            <CardHeader className="bg-orange-50 dark:bg-orange-900/20">
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5 text-orange-600" />
                ptResourceCapabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Junction Table Fields:</div>
                <div className="pl-2 space-y-1">
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">id</span> (PK)</div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1 rounded">
                    <span className="font-mono bg-yellow-200 dark:bg-yellow-800 px-1 rounded">resourceId</span> 
                    <span className="text-xs ml-1">(FK to ptResources.resourceId)</span>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1 rounded">
                    <span className="font-mono bg-yellow-200 dark:bg-yellow-800 px-1 rounded">capabilityId</span>
                    <span className="text-xs ml-1">(FK to ptCapabilities.capabilityId)</span>
                  </div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">plantId</span> (FK)</div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">departmentId</span> (FK)</div>
                </div>
                <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs">
                  Links resources to their capabilities (many-to-many relationship)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Supporting Table */}
        <div className="flex justify-center">
          <Card className="border-gray-500 border-2 w-full max-w-md">
            <CardHeader className="bg-gray-50 dark:bg-gray-800">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-600" />
                ptDepartments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Fields:</div>
                <div className="pl-2 space-y-1">
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">id</span> (PK)</div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">departmentId</span> (PT ID)</div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">name</span></div>
                  <div><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">plantId</span> (FK)</div>
                </div>
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                  Department reference for grouping employees and resources
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Flow Explanation */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              How the Resource Capability Matrix Should Be Populated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">For Employee Skills Matrix:</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Query <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">employees</code> table to get all employees with their departments</li>
                  <li>Query <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">ptCapabilities</code> to get all available skills</li>
                  <li>For each employee, check their <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">capabilities</code> JSONB array</li>
                  <li>Create a matrix showing proficiency levels (0-5) for each employee-skill combination</li>
                  <li>Store proficiency levels in a separate table or as part of the capabilities JSONB</li>
                </ol>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">For Resource Capability Matrix:</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Query <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">employees</code> table (employees who can operate resources)</li>
                  <li>Query <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">ptResources</code> to get all available resources/machines</li>
                  <li>Query <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">ptResourceCapabilities</code> to find which resources each employee can operate</li>
                  <li>Create a matrix showing proficiency levels (0-5) for each employee-resource combination</li>
                  <li>Display grouped by department for better organization</li>
                </ol>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">Current Implementation Status:</h3>
                <p className="text-orange-700 dark:text-orange-300">
                  ⚠️ Currently using mock data in the Labor Planning page. The matrices need to be connected to these actual database tables to display real employee skills and resource capabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}