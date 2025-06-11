
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ClassSectionSelector from './ClassSectionSelector';
import PeriodDateSelector from './PeriodDateSelector';
import StudentAttendanceGrid from './StudentAttendanceGrid';
import { useProfile } from '@/hooks/useProfile';

const AttendanceMarkingPage = () => {
  const { profile } = useProfile();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);

  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to mark attendance. This feature is only available for teachers and administrators.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Mark Attendance</h2>
        <p className="text-muted-foreground">
          Select a class, section, date, and periods to mark student attendance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Class & Section</CardTitle>
          </CardHeader>
          <CardContent>
            <ClassSectionSelector
              selectedClass={selectedClass}
              selectedSection={selectedSection}
              onClassChange={setSelectedClass}
              onSectionChange={setSelectedSection}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Date & Periods</CardTitle>
          </CardHeader>
          <CardContent>
            <PeriodDateSelector
              selectedDate={selectedDate}
              selectedPeriods={selectedPeriods}
              onDateChange={setSelectedDate}
              onPeriodsChange={setSelectedPeriods}
            />
          </CardContent>
        </Card>
      </div>

      {selectedClass && selectedSection && selectedPeriods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentAttendanceGrid
              classId={selectedClass}
              sectionId={selectedSection}
              date={selectedDate}
              periods={selectedPeriods}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceMarkingPage;
