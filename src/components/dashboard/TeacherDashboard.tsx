
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
      fetchAttendance();
    }
  }, [selectedClass, selectedSection, selectedDate, selectedPeriod]);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('sections')
      .select(`
        *,
        classes(*)
      `)
      .eq('teacher_id', user?.id);
    
    if (error) {
      console.error('Error fetching classes:', error);
    } else {
      const uniqueClasses = Array.from(
        new Map(data?.map(item => [item.classes.id, item.classes]) || []).values()
      );
      setClasses(uniqueClasses);
      setSections(data || []);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', selectedClass)
      .eq('section_id', selectedSection)
      .order('roll_no');
    
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data || []);
    }
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('class_id', selectedClass)
      .eq('section_id', selectedSection)
      .eq('date', selectedDate)
      .eq('period', selectedPeriod);
    
    if (error) {
      console.error('Error fetching attendance:', error);
    } else {
      const attendanceMap = {};
      data?.forEach(record => {
        attendanceMap[record.student_id] = record.status;
      });
      setAttendance(attendanceMap);
    }
  };

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    const attendanceRecords = students.map((student: any) => ({
      student_id: student.id,
      class_id: selectedClass,
      section_id: selectedSection,
      date: selectedDate,
      period: selectedPeriod,
      status: attendance[student.id] || 'absent',
      marked_by: user?.id
    }));

    // Delete existing attendance for this period
    await supabase
      .from('attendance')
      .delete()
      .eq('class_id', selectedClass)
      .eq('section_id', selectedSection)
      .eq('date', selectedDate)
      .eq('period', selectedPeriod);

    // Insert new attendance
    const { error } = await supabase
      .from('attendance')
      .insert(attendanceRecords);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Attendance saved successfully!',
      });
    }
  };

  const filteredSections = sections.filter(section => section.class_id === selectedClass);

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Object.values(attendance).filter(status => status === 'present').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{new Date().toLocaleDateString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Select class, section, and period to mark attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSections.map((section: any) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Period</label>
              <Select value={selectedPeriod.toString()} onValueChange={(value) => setSelectedPeriod(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map(period => (
                    <SelectItem key={period} value={period.toString()}>
                      Period {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={saveAttendance} className="w-full">
                Save Attendance
              </Button>
            </div>
          </div>

          {students.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Late</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.roll_no}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={attendance[student.id] === 'present'}
                          onCheckedChange={(checked) => 
                            checked && handleAttendanceChange(student.id, 'present')
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={attendance[student.id] === 'absent'}
                          onCheckedChange={(checked) => 
                            checked && handleAttendanceChange(student.id, 'absent')
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={attendance[student.id] === 'late'}
                          onCheckedChange={(checked) => 
                            checked && handleAttendanceChange(student.id, 'late')
                          }
                        />
                      </TableCell>
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

export default TeacherDashboard;
