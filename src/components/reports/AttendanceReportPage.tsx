
import React, { useState, useEffect } from 'react';
import { useAttendanceReport } from '@/hooks/useAttendanceReport';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AttendanceReportFilters from './AttendanceReportFilters';
import AttendanceStatsCards from './AttendanceStatsCards';
import AttendanceReportTable from './AttendanceReportTable';

interface Class {
  id: string;
  name: string;
}

const AttendanceReportPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  
  const { reportData, institutionStats, loading, error, refetch } = useAttendanceReport();
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching classes:', error);
        toast({
          title: "Error",
          description: "Failed to load classes",
          variant: "destructive",
        });
      } else {
        setClasses(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      });
    } finally {
      setClassesLoading(false);
    }
  };

  const handleApplyFilters = () => {
    const filters = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      classId: selectedClass === 'all' ? undefined : selectedClass,
    };
    refetch(filters);
  };

  const handleExportReport = () => {
    if (reportData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = [
      'Class',
      'Section',
      'Total Students',
      'Total Records',
      'Present',
      'Absent',
      'Late',
      'Attendance %'
    ];
    
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        row.class_name,
        row.section_name,
        row.total_students,
        row.total_attendance_records,
        row.present_count,
        row.absent_count,
        row.late_count,
        (row.attendance_percentage || 0).toFixed(1)
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Attendance report has been downloaded",
    });
  };

  const handleRefresh = () => {
    refetch();
  };

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Attendance Report</h1>
        <p className="text-muted-foreground">
          Comprehensive attendance insights and analytics
        </p>
      </div>

      <AttendanceReportFilters
        startDate={startDate}
        endDate={endDate}
        selectedClass={selectedClass}
        classes={classes}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClassChange={setSelectedClass}
        onApplyFilters={handleApplyFilters}
        onExportReport={handleExportReport}
        onRefresh={handleRefresh}
        loading={loading || classesLoading}
      />

      {institutionStats && (
        <AttendanceStatsCards stats={institutionStats} />
      )}

      <AttendanceReportTable data={reportData} loading={loading} />
    </div>
  );
};

export default AttendanceReportPage;
