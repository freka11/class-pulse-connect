
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

interface UseStudentDataResult {
  student: Student | null;
  attendanceRecords: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useStudentData = (): UseStudentDataResult => {
  const [student, setStudent] = useState<Student | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStudentInfo = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          classes(name),
          sections(name)
        `)
        .eq('user_id', user.id)
        .single();
      
      if (studentError) {
        if (studentError.code === 'PGRST116') {
          setError('Student profile not found. Please contact your administrator.');
        } else {
          console.error('Error fetching student info:', studentError);
          setError('Unable to load student information. Please try again.');
        }
        toast({
          title: "Error",
          description: "Failed to load student information",
          variant: "destructive",
        });
        return;
      }

      setStudent(data);
      
      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', data.id)
        .order('date', { ascending: false })
        .order('period', { ascending: false });
      
      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        setError('Unable to load attendance records. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load attendance records",
          variant: "destructive",
        });
      } else {
        setAttendanceRecords(attendanceData || []);
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

  const refetch = async () => {
    setLoading(true);
    await fetchStudentInfo();
  };

  useEffect(() => {
    fetchStudentInfo();
  }, [user]);

  return {
    student,
    attendanceRecords,
    loading,
    error,
    refetch,
  };
};
