
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "lucide-react";

// If/when you create a dedicated "timetable" table replace this logic.
interface TimetableEntry {
  id: string;
  period_number: number;
  name: string; // subject or period name
  start_time: string;
  end_time: string;
}

interface StudentTimetableProps {
  classId: string;    // in this app the class/section "name" is used
  sectionId: string;
}

const StudentTimetable: React.FC<StudentTimetableProps> = ({ classId, sectionId }) => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dummy logic: show periods from periods table by period_number and name.
    const fetchTimetable = async () => {
      setError(null);
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('periods')
          .select('id, period_number, name, start_time, end_time')
          .order('period_number', { ascending: true });

        if (error) throw error;
        setTimetable(data || []);
      } catch (err) {
        setError("Unable to load timetable. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [classId, sectionId]);

  if (loading) return <div className="py-4 text-center">Loading timetable...</div>;
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <Calendar className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!timetable.length) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No timetable information available.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timetable.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.period_number}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.start_time ? row.start_time.slice(0, 5) : "-"}</TableCell>
              <TableCell>{row.end_time ? row.end_time.slice(0, 5) : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-2 text-muted-foreground text-xs">
        This timetable is for display purposes. For complete subject/teacher mapping, ask your administrator to add subject schedules.
      </div>
    </div>
  );
};

export default StudentTimetable;
