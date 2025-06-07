import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Users, CheckCircle, XCircle, Clock, Edit, Plus } from 'lucide-react';
import PeriodSelector from './PeriodSelector';
import type { Database } from '@/integrations/supabase/types';

type GenderType = Database['public']['Enums']['gender_type'];

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudent, setNewStudent] = useState({
    roll_no: '',
    full_name: '',
    class_id: '',
    section_id: '',
    gender: '' as GenderType,
    date_of_birth: '',
    guardian_name: '',
    guardian_contact: '',
    address: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
    fetchPeriods();
    fetchAllStudents();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (selectedClass && selectedSection && selectedPeriods.length > 0) {
      fetchAttendance();
    }
  }, [selectedClass, selectedSection, selectedDate, selectedPeriods]);

  const fetchPeriods = async () => {
    console.log('Fetching periods...');
    const { data, error } = await supabase
      .from('periods')
      .select('*')
      .order('period_number');
    
    if (error) {
      console.error('Error fetching periods:', error);
    } else {
      console.log('Periods fetched:', data);
      setPeriods(data || []);
    }
  };

  const fetchClasses = async () => {
    console.log('Fetching classes for teacher:', user?.id);
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
      console.log('Sections data:', data);
      const uniqueClasses = Array.from(
        new Map(data?.map(item => [item.classes.id, item.classes]) || []).values()
      );
      setClasses(uniqueClasses);
      setSections(data || []);
    }
  };

  const fetchAllStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        classes(name),
        sections(name)
      `)
      .order('roll_no');
    
    if (error) {
      console.error('Error fetching all students:', error);
    } else {
      setAllStudents(data || []);
    }
  };

  const fetchStudents = async () => {
    console.log('Fetching students for class:', selectedClass, 'section:', selectedSection);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', selectedClass)
      .eq('section_id', selectedSection)
      .order('roll_no');
    
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      console.log('Students fetched:', data);
      setStudents(data || []);
      // Initialize attendance state for all students
      const initialAttendance = {};
      data?.forEach(student => {
        initialAttendance[student.id] = {};
        selectedPeriods.forEach(period => {
          initialAttendance[student.id][period] = 'absent';
        });
      });
      setAttendance(prev => ({ ...prev, ...initialAttendance }));
    }
  };

  const fetchAttendance = async () => {
    if (selectedPeriods.length === 0) return;

    console.log('Fetching existing attendance for date:', selectedDate, 'periods:', selectedPeriods);
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('class_id', selectedClass)
      .eq('section_id', selectedSection)
      .eq('date', selectedDate)
      .in('period', selectedPeriods);
    
    if (error) {
      console.error('Error fetching attendance:', error);
    } else {
      console.log('Existing attendance:', data);
      const attendanceMap = {};
      
      // Initialize all students with 'absent' for selected periods
      students.forEach(student => {
        attendanceMap[student.id] = {};
        selectedPeriods.forEach(period => {
          attendanceMap[student.id][period] = 'absent';
        });
      });
      
      // Update with existing attendance data
      data?.forEach(record => {
        if (attendanceMap[record.student_id]) {
          attendanceMap[record.student_id][record.period] = record.status;
        }
      });
      
      setAttendance(attendanceMap);
    }
  };

  const handleAttendanceChange = (studentId: string, period: number, status: string) => {
    console.log('Changing attendance for student:', studentId, 'period:', period, 'status:', status);
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [period]: status
      }
    }));
  };

  const saveAttendance = async () => {
    if (selectedPeriods.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one period',
        variant: 'destructive',
      });
      return;
    }

    if (students.length === 0) {
      toast({
        title: 'Error',
        description: 'No students found for the selected class and section',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Saving attendance...');
      
      // Delete existing attendance for these periods
      for (const period of selectedPeriods) {
        await supabase
          .from('attendance')
          .delete()
          .eq('class_id', selectedClass)
          .eq('section_id', selectedSection)
          .eq('date', selectedDate)
          .eq('period', period);
      }

      // Insert new attendance records
      const attendanceRecords = [];
      students.forEach((student: any) => {
        selectedPeriods.forEach(period => {
          const status = attendance[student.id]?.[period] || 'absent';
          attendanceRecords.push({
            student_id: student.id,
            class_id: selectedClass,
            section_id: selectedSection,
            date: selectedDate,
            period: period,
            status: status,
            marked_by: user?.id
          });
        });
      });

      console.log('Inserting attendance records:', attendanceRecords);
      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: `Attendance saved successfully for ${selectedPeriods.length} period(s)!`,
      });
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('students')
      .insert([newStudent]);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Student added successfully!',
      });
      setNewStudent({
        roll_no: '',
        full_name: '',
        class_id: '',
        section_id: '',
        gender: '' as GenderType,
        date_of_birth: '',
        guardian_name: '',
        guardian_contact: '',
        address: ''
      });
      fetchAllStudents();
      if (selectedClass && selectedSection) {
        fetchStudents();
      }
    }
  };

  const handleEditStudent = async (student: any) => {
    const { error } = await supabase
      .from('students')
      .update({
        class_id: student.class_id,
        section_id: student.section_id,
        full_name: student.full_name,
        roll_no: student.roll_no,
        gender: student.gender,
        date_of_birth: student.date_of_birth,
        guardian_name: student.guardian_name,
        guardian_contact: student.guardian_contact,
        address: student.address
      })
      .eq('id', student.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Student updated successfully!',
      });
      setEditingStudent(null);
      fetchAllStudents();
      if (selectedClass && selectedSection) {
        fetchStudents();
      }
    }
  };

  const filteredSections = sections.filter(section => section.class_id === selectedClass);
  const allFilteredSections = sections;
  
  // Real-time calculation of present count across all selected periods
  const presentCount = students.reduce((count, student: any) => {
    const studentAttendance = attendance[student.id] || {};
    const isPresentInAnyPeriod = selectedPeriods.some(period => 
      studentAttendance[period] === 'present'
    );
    return count + (isPresentInAnyPeriod ? 1 : 0);
  }, 0);
  
  const totalStudents = students.length;

  // Check if we should show the attendance interface
  const showAttendanceInterface = selectedClass && selectedSection && selectedPeriods.length > 0 && students.length > 0;

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
            <div className="text-2xl font-bold">{allStudents.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {presentCount}/{totalStudents}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Periods</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedPeriods.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList>
          <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
          <TabsTrigger value="students">Manage Students</TabsTrigger>
          <TabsTrigger value="add-student">Add Student</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
                <CardDescription>Select class, section, periods, and date to mark attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                    <label className="text-sm font-medium">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={saveAttendance} 
                      className="w-full" 
                      disabled={!showAttendanceInterface}
                    >
                      Save Attendance
                    </Button>
                  </div>
                </div>

                {/* Period Selector - Always show when periods are available */}
                {periods.length > 0 && (
                  <div className="mb-6">
                    <PeriodSelector
                      periods={periods}
                      selectedPeriods={selectedPeriods}
                      onPeriodsChange={setSelectedPeriods}
                    />
                  </div>
                )}

                {/* Status Messages */}
                {!selectedClass && (
                  <div className="p-4 bg-blue-50 rounded-lg mb-4">
                    <p className="text-blue-800 text-sm">Please select a class to continue.</p>
                  </div>
                )}

                {selectedClass && !selectedSection && (
                  <div className="p-4 bg-blue-50 rounded-lg mb-4">
                    <p className="text-blue-800 text-sm">Please select a section to continue.</p>
                  </div>
                )}

                {selectedClass && selectedSection && selectedPeriods.length === 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg mb-4">
                    <p className="text-yellow-800 text-sm">Please select at least one period to mark attendance.</p>
                  </div>
                )}

                {selectedClass && selectedSection && students.length === 0 && selectedPeriods.length > 0 && (
                  <div className="p-4 bg-orange-50 rounded-lg mb-4">
                    <p className="text-orange-800 text-sm">No students found for the selected class and section.</p>
                  </div>
                )}

                {/* Attendance Marking Interface */}
                {showAttendanceInterface && (
                  <>
                    <div className="mb-4 p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800">
                        Marking attendance for {selectedPeriods.length} period(s): {presentCount} students present out of {totalStudents}
                        {totalStudents > 0 && ` (${Math.round((presentCount / totalStudents) * 100)}%)`}
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Roll No</TableHead>
                            <TableHead>Student Name</TableHead>
                            {selectedPeriods.map(period => (
                              <TableHead key={period} className="text-center">
                                Period {period}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student: any) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.roll_no}</TableCell>
                              <TableCell>{student.full_name}</TableCell>
                              {selectedPeriods.map(period => (
                                <TableCell key={period} className="text-center">
                                  <div className="flex justify-center gap-2">
                                    <div className="flex items-center space-x-1">
                                      <Checkbox
                                        checked={attendance[student.id]?.[period] === 'present'}
                                        onCheckedChange={(checked) => 
                                          checked && handleAttendanceChange(student.id, period, 'present')
                                        }
                                      />
                                      <span className="text-xs text-green-600">P</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Checkbox
                                        checked={attendance[student.id]?.[period] === 'absent'}
                                        onCheckedChange={(checked) => 
                                          checked && handleAttendanceChange(student.id, period, 'absent')
                                        }
                                      />
                                      <span className="text-xs text-red-600">A</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Checkbox
                                        checked={attendance[student.id]?.[period] === 'late'}
                                        onCheckedChange={(checked) => 
                                          checked && handleAttendanceChange(student.id, period, 'late')
                                        }
                                      />
                                      <span className="text-xs text-yellow-600">L</span>
                                    </div>
                                  </div>
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Manage Students</CardTitle>
              <CardDescription>Edit student information and class assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Guardian</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allStudents.map((student: any) => (
                      <TableRow key={student.id}>
                        {editingStudent?.id === student.id ? (
                          <>
                            <TableCell>
                              <Input
                                value={editingStudent.roll_no}
                                onChange={(e) => setEditingStudent({...editingStudent, roll_no: e.target.value})}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editingStudent.full_name}
                                onChange={(e) => setEditingStudent({...editingStudent, full_name: e.target.value})}
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={editingStudent.class_id}
                                onValueChange={(value) => setEditingStudent({...editingStudent, class_id: value, section_id: ''})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {classes.map((cls: any) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                      {cls.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={editingStudent.section_id}
                                onValueChange={(value) => setEditingStudent({...editingStudent, section_id: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {allFilteredSections.filter(s => s.class_id === editingStudent.class_id).map((section: any) => (
                                    <SelectItem key={section.id} value={section.id}>
                                      {section.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={editingStudent.gender}
                                onValueChange={(value: GenderType) => setEditingStudent({...editingStudent, gender: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editingStudent.guardian_name}
                                onChange={(e) => setEditingStudent({...editingStudent, guardian_name: e.target.value})}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editingStudent.guardian_contact}
                                onChange={(e) => setEditingStudent({...editingStudent, guardian_contact: e.target.value})}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleEditStudent(editingStudent)}>
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingStudent(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{student.roll_no}</TableCell>
                            <TableCell>{student.full_name}</TableCell>
                            <TableCell>{student.classes?.name}</TableCell>
                            <TableCell>{student.sections?.name}</TableCell>
                            <TableCell className="capitalize">{student.gender}</TableCell>
                            <TableCell>{student.guardian_name}</TableCell>
                            <TableCell>{student.guardian_contact}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingStudent(student)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-student">
          <Card>
            <CardHeader>
              <CardTitle>Add New Student</CardTitle>
              <CardDescription>Enter student details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="roll_no">Roll Number</Label>
                    <Input
                      id="roll_no"
                      value={newStudent.roll_no}
                      onChange={(e) => setNewStudent({ ...newStudent, roll_no: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newStudent.full_name}
                      onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Select
                      value={newStudent.class_id}
                      onValueChange={(value) => setNewStudent({ ...newStudent, class_id: value, section_id: '' })}
                    >
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
                    <Label htmlFor="section">Section</Label>
                    <Select
                      value={newStudent.section_id}
                      onValueChange={(value) => setNewStudent({ ...newStudent, section_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {allFilteredSections.filter(s => s.class_id === newStudent.class_id).map((section: any) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={newStudent.gender}
                      onValueChange={(value: GenderType) => setNewStudent({ ...newStudent, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={newStudent.date_of_birth}
                      onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardian_name">Guardian Name</Label>
                    <Input
                      id="guardian_name"
                      value={newStudent.guardian_name}
                      onChange={(e) => setNewStudent({ ...newStudent, guardian_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardian_contact">Guardian Contact</Label>
                    <Input
                      id="guardian_contact"
                      value={newStudent.guardian_contact}
                      onChange={(e) => setNewStudent({ ...newStudent, guardian_contact: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newStudent.address}
                    onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
