import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle, XCircle, Clock, User, AlertCircle, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StudentTimetable from './StudentTimetable';

interface Student {
  id: string;
  full_name: string;
  roll_no: string;
  date_of_birth: string;
  guardian_name: string;
  guardian_contact: string;
  classes?: { name: string };
  sections?: { name: string };
}

interface AttendanceRecord {
  id: string;
  date: string;
  period: number;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

const StudentDashboard = () => {
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchStudentInfo();
    }
  }, [user]);

  useEffect(() => {
    if (studentInfo) {
      fetchAttendanceRecords();
    }
  }, [studentInfo]);

  const fetchStudentInfo = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes(name),
          sections(name)
        `)
        .eq('user_id', user?.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          setError('Student profile not found. Please contact your administrator.');
        } else {
          console.error('Error fetching student info:', error);
          setError('Unable to load student information. Please try again.');
        }
        toast({
          title: "Error",
          description: "Failed to load student information",
          variant: "destructive",
        });
      } else {
        setStudentInfo(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    if (!studentInfo) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentInfo.id)
        .order('date', { ascending: false })
        .order('period', { ascending: false });
      
      if (error) {
        console.error('Error fetching attendance:', error);
        setError('Unable to load attendance records. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load attendance records",
          variant: "destructive",
        });
      } else {
        setAttendanceRecords(data || []);
        calculateStats(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while loading attendance.');
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    }
  };

  const calculateStats = (records: AttendanceRecord[]) => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const total = records.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    setAttendanceStats({
      present,
      absent,
      late,
      total,
      percentage
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600';
      case 'absent':
        return 'text-red-600';
      case 'late':
        return 'text-yellow-600';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Get today's attendance record
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendanceRecords.find((r) => r.date === todayStr);

  // Cards breakdown
  const workingDays = attendanceStats.total; // Assuming each attendance record is for a day; can be refactored for "academic year" logic.

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading student dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No student profile found. Please contact your administrator to set up your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Daily Attendance Banner */}
      <div className="mb-6">
        <div className="rounded-lg p-4 flex items-center gap-4 bg-blue-50 border border-blue-100">
          {todayAttendance ? (
            <>
              {getStatusIcon(todayAttendance.status)}
              <span className="font-medium text-lg">
                Today's Attendance: <span className={`capitalize ${getStatusColor(todayAttendance.status)}`}>{todayAttendance.status}</span>
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="font-medium text-lg text-yellow-700">
                You have not been marked for today yet.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Student Profile */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold">{studentInfo.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Roll Number</p>
              <p className="font-semibold">{studentInfo.roll_no}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Class & Section</p>
              <p className="font-semibold">
                {studentInfo.classes?.name || 'Not assigned'} - {studentInfo.sections?.name || 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Birth</p>
              <p className="font-semibold">{formatDate(studentInfo.date_of_birth)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Guardian</p>
              <p className="font-semibold">{studentInfo.guardian_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Guardian Contact</p>
              <p className="font-semibold">{studentInfo.guardian_contact}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workingDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance %</CardTitle>
            <ChartBar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.percentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Timetable Access */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center gap-3">
          <List className="h-5 w-5" />
          <CardTitle>Class Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentTimetable
            classId={studentInfo.classes?.name ? studentInfo.classes.name : ''}
            sectionId={studentInfo.sections?.name ? studentInfo.sections.name : ''}
          />
        </CardContent>
      </Card>

      {/* Attendance history table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your recent attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No attendance records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>Period {record.period}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-2 ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="capitalize">{record.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{record.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
