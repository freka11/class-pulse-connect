
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AttendanceReportData {
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  total_students: number;
  total_attendance_records: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_percentage: number;
}

interface InstitutionStats {
  total_students: number;
  total_attendance_records: number;
  total_present: number;
  total_absent: number;
  total_late: number;
  overall_attendance_percentage: number;
}

interface UseAttendanceReportResult {
  reportData: AttendanceReportData[];
  institutionStats: InstitutionStats | null;
  loading: boolean;
  error: string | null;
  refetch: (filters?: { startDate?: string; endDate?: string; classId?: string }) => Promise<void>;
}

export const useAttendanceReport = (): UseAttendanceReportResult => {
  const [reportData, setReportData] = useState<AttendanceReportData[]>([]);
  const [institutionStats, setInstitutionStats] = useState<InstitutionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAttendanceReport = async (filters?: { startDate?: string; endDate?: string; classId?: string }) => {
    try {
      setError(null);
      
      // Fetch detailed report data using the optimized function
      const { data: reportResult, error: reportError } = await supabase.rpc('get_attendance_report', {
        start_date: filters?.startDate || null,
        end_date: filters?.endDate || null,
        class_filter: filters?.classId || null,
      });

      if (reportError) {
        console.error('Error fetching attendance report:', reportError);
        setError('Failed to load attendance report. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load attendance report",
          variant: "destructive",
        });
        return;
      }

      // Fetch institution statistics using the optimized view
      const { data: statsResult, error: statsError } = await supabase
        .from('institution_statistics')
        .select('*')
        .single();

      if (statsError) {
        console.error('Error fetching institution stats:', statsError);
        setError('Failed to load institution statistics. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load institution statistics",
          variant: "destructive",
        });
        return;
      }

      setReportData(reportResult || []);
      setInstitutionStats(statsResult);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while loading the report.');
      toast({
        title: "Error",
        description: "Failed to load attendance report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refetch = async (filters?: { startDate?: string; endDate?: string; classId?: string }) => {
    setLoading(true);
    await fetchAttendanceReport(filters);
  };

  useEffect(() => {
    fetchAttendanceReport();
  }, []);

  return {
    reportData,
    institutionStats,
    loading,
    error,
    refetch,
  };
};
