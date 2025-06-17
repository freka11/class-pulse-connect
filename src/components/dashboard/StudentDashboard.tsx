
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Calendar, Clock, User } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useStudentData } from '@/hooks/useStudentData';
import StudentTimetable from './StudentTimetable';

const StudentDashboard = () => {
  const { profile } = useProfile();
  const { student, attendanceRecords, loading } = useStudentData();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading your dashboard...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8 text-muted-foreground">
          Student profile not found. Please contact your administrator.
        </div>
      </div>
    );
  }

  // Calculate attendance statistics
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
  const absentDays = attendanceRecords.filter(record => record.status === 'absent').length;
  const lateDays = attendanceRecords.filter(record => record.status === 'late').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Get recent attendance (last 7 days)
  const recentAttendance = attendanceRecords
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {student.full_name}</h1>
        <p className="text-muted-foreground">
          Class {student.classes?.name} - Section {student.sections?.name}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="timetable" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timetable
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendancePercentage}%</div>
                <p className="text-xs text-muted-foreground">
                  {presentDays} present out of {totalDays} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present Days</CardTitle>
                <User className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{presentDays}</div>
                <p className="text-xs text-muted-foreground">Days attended</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
                <User className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{absentDays}</div>
                <p className="text-xs text-muted-foreground">Days missed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late Days</CardTitle>
                <User className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{lateDays}</div>
                <p className="text-xs text-muted-foreground">Days late</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>Your attendance over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttendance.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent attendance records</p>
              ) : (
                <div className="space-y-2">
                  {recentAttendance.map((record, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded border">
                      <span>{new Date(record.date).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Attendance History</CardTitle>
              <CardDescription>Complete record of your attendance</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No attendance records found</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {attendanceRecords
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded border">
                        <div>
                          <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                          <span className="text-sm text-muted-foreground ml-2">Period {record.period}</span>
                        </div>
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable">
          <Card>
            <CardHeader>
              <CardTitle>Class Timetable</CardTitle>
              <CardDescription>Your daily schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentTimetable 
                classId={student.class_id || ''} 
                sectionId={student.section_id || ''} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
