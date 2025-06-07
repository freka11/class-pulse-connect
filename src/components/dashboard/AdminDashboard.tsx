import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, GraduationCap, BookOpen, Calendar, Edit, Plus, Settings } from 'lucide-react';
import ClassSectionManager from './ClassSectionManager';
import type { Database } from '@/integrations/supabase/types';

type GenderType = Database['public']['Enums']['gender_type'];

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
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
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, []);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*, sections(*)');
    
    if (error) {
      console.error('Error fetching classes:', error);
    } else {
      setClasses(data || []);
      const allSections = data?.flatMap(cls => cls.sections) || [];
      setSections(allSections);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        classes(name),
        sections(name)
      `);
    
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data || []);
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
      fetchStudents();
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
      fetchStudents();
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Student deleted successfully!',
        });
        fetchStudents();
      }
    }
  };

  const filteredSections = sections.filter(section => section.class_id === newStudent.class_id);

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sections.length}</div>
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

      <Tabs defaultValue="students" className="w-full">
        <TabsList>
          <TabsTrigger value="students">Manage Students</TabsTrigger>
          <TabsTrigger value="add-student">Add Student</TabsTrigger>
          <TabsTrigger value="classes-sections">Classes & Sections</TabsTrigger>
        </TabsList>
        
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
              <CardDescription>Manage student records and assignments</CardDescription>
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
                    {students.map((student: any) => (
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
                                  {sections.filter(s => s.class_id === editingStudent.class_id).map((section: any) => (
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
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingStudent(student)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteStudent(student.id)}
                                >
                                  Delete
                                </Button>
                              </div>
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
                        {filteredSections.map((section: any) => (
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
        
        <TabsContent value="classes-sections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Classes & Sections Management
              </CardTitle>
              <CardDescription>
                Manage school classes, sections, and teacher assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClassSectionManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
