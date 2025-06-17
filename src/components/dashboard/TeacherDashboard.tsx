
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Users, CheckSquare, FileText, UserPlus } from 'lucide-react';
import StudentManager from './StudentManager';
import AttendanceReportPage from '../reports/AttendanceReportPage';
import AttendanceMarkingPage from '../attendance/AttendanceMarkingPage';

const TeacherDashboard = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Manage attendance for your classes
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
          <TabsTrigger value="students" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Classes
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

        <TabsContent value="students">
          <StudentManager />
        </TabsContent>

        <TabsContent value="classes">
          <div className="text-center py-8 text-muted-foreground">
            Class information display coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
