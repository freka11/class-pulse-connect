
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Users, GraduationCap, FileText, CheckSquare } from 'lucide-react';
import ClassSectionManager from './ClassSectionManager';
import AttendanceReportPage from '../reports/AttendanceReportPage';
import AttendanceMarkingPage from '../attendance/AttendanceMarkingPage';

const AdminDashboard = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your institution's attendance system
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AttendanceReportPage />
        </TabsContent>

        <TabsContent value="reports">
          <AttendanceReportPage />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceMarkingPage />
        </TabsContent>

        <TabsContent value="classes">
          <ClassSectionManager />
        </TabsContent>

        <TabsContent value="users">
          <div className="text-center py-8 text-muted-foreground">
            User management functionality coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
