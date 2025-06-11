
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

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

interface AttendanceReportTableProps {
  data: AttendanceReportData[];
  loading: boolean;
}

const AttendanceReportTable: React.FC<AttendanceReportTableProps> = ({ data, loading }) => {
  const getAttendanceBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return 'default'; // Green
    if (percentage >= 75) return 'secondary'; // Yellow
    return 'destructive'; // Red
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-lg">Loading attendance report...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class-wise Attendance Report</CardTitle>
        <CardDescription>
          Detailed attendance breakdown by class and section
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No attendance data found for the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class & Section</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-center">Records</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Present
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Absent
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Late
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={`${row.class_id}-${row.section_id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{row.class_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Section {row.section_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{row.total_students}</TableCell>
                    <TableCell className="text-center">{row.total_attendance_records}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-medium">{row.present_count}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-red-600 font-medium">{row.absent_count}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-yellow-600 font-medium">{row.late_count}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getAttendanceBadgeVariant(row.attendance_percentage || 0)}>
                        {row.attendance_percentage?.toFixed(1) || 0}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceReportTable;
