
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Save } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  roll_no: string;
}

interface AttendanceRecord {
  student_id: string;
  period: number;
  status: 'present' | 'absent' | 'late';
}

interface StudentAttendanceGridProps {
  classId: string;
  sectionId: string;
  date: Date;
  periods: number[];
}

const StudentAttendanceGrid: React.FC<StudentAttendanceGridProps> = ({
  classId,
  sectionId,
  date,
  periods,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attendanceData, setAttendanceData] = useState<Map<string, 'present' | 'absent' | 'late'>>(new Map());

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, roll_no')
        .eq('section_id', sectionId)
        .order('roll_no');
      
      if (error) throw error;
      return data as Student[];
    },
    enabled: !!sectionId,
  });

  const { data: existingAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', sectionId, format(date, 'yyyy-MM-dd'), periods],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('student_id, period, status')
        .eq('section_id', sectionId)
        .eq('date', format(date, 'yyyy-MM-dd'))
        .in('period', periods);
      
      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!sectionId && periods.length > 0,
  });

  React.useEffect(() => {
    if (existingAttendance) {
      const newAttendanceData = new Map();
      existingAttendance.forEach(record => {
        const key = `${record.student_id}-${record.period}`;
        newAttendanceData.set(key, record.status);
      });
      setAttendanceData(newAttendanceData);
    }
  }, [existingAttendance]);

  const markAttendanceMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const attendanceRecords = [];
      for (const student of students || []) {
        for (const period of periods) {
          const key = `${student.id}-${period}`;
          const status = attendanceData.get(key) || 'absent';
          attendanceRecords.push({
            student_id: student.id,
            class_id: classId,
            section_id: sectionId,
            date: format(date, 'yyyy-MM-dd'),
            period,
            status,
            marked_by: user.id,
          });
        }
      }

      // Delete existing records for this date and periods
      await supabase
        .from('attendance')
        .delete()
        .eq('section_id', sectionId)
        .eq('date', format(date, 'yyyy-MM-dd'))
        .in('period', periods);

      // Insert new records
      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance has been marked successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error) => {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (studentId: string, period: number, status: 'present' | 'absent' | 'late') => {
    const key = `${studentId}-${period}`;
    const newData = new Map(attendanceData);
    newData.set(key, status);
    setAttendanceData(newData);
  };

  const handleMarkAllPresent = () => {
    const newData = new Map();
    students?.forEach(student => {
      periods.forEach(period => {
        const key = `${student.id}-${period}`;
        newData.set(key, 'present' as const);
      });
    });
    setAttendanceData(newData);
  };

  if (studentsLoading || attendanceLoading) {
    return <div className="text-center py-8">Loading students...</div>;
  }

  if (!students?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No students found in this section.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Marking attendance for {format(date, 'MMMM d, yyyy')} • Periods: {periods.join(', ')}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
            Mark All Present
          </Button>
          <Button 
            onClick={() => markAttendanceMutation.mutate()}
            disabled={markAttendanceMutation.isPending}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {markAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Roll No</th>
                <th className="px-4 py-3 text-left font-medium">Student Name</th>
                {periods.map(period => (
                  <th key={period} className="px-4 py-3 text-center font-medium">
                    Period {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                  <td className="px-4 py-3 font-medium">{student.roll_no}</td>
                  <td className="px-4 py-3">{student.full_name}</td>
                  {periods.map(period => {
                    const key = `${student.id}-${period}`;
                    const status = attendanceData.get(key);
                    return (
                      <td key={period} className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant={status === 'present' ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleStatusChange(student.id, period, 'present')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={status === 'absent' ? 'destructive' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleStatusChange(student.id, period, 'absent')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={status === 'late' ? 'secondary' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleStatusChange(student.id, period, 'late')}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 justify-start">
        <div className="flex items-center gap-1">
          <Badge className="bg-primary">
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Absent
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Late
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceGrid;
