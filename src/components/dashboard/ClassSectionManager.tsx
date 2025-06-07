
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2 } from 'lucide-react';

const ClassSectionManager = () => {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [newClass, setNewClass] = useState({ name: '', description: '' });
  const [newSection, setNewSection] = useState({ name: '', class_id: '', teacher_id: '' });
  const [editingClass, setEditingClass] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
    fetchSections();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching classes:', error);
    } else {
      setClasses(data || []);
    }
  };

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from('sections')
      .select(`
        *,
        classes(name),
        profiles(full_name)
      `)
      .order('name');
    
    if (error) {
      console.error('Error fetching sections:', error);
    } else {
      setSections(data || []);
    }
  };

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching teachers:', error);
    } else {
      setTeachers(data || []);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('classes')
      .insert([newClass]);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Class added successfully!',
      });
      setNewClass({ name: '', description: '' });
      fetchClasses();
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('sections')
      .insert([newSection]);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Section added successfully!',
      });
      setNewSection({ name: '', class_id: '', teacher_id: '' });
      fetchSections();
    }
  };

  const handleUpdateClass = async (cls: any) => {
    const { error } = await supabase
      .from('classes')
      .update({
        name: cls.name,
        description: cls.description
      })
      .eq('id', cls.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Class updated successfully!',
      });
      setEditingClass(null);
      fetchClasses();
    }
  };

  const handleUpdateSection = async (section: any) => {
    const { error } = await supabase
      .from('sections')
      .update({
        name: section.name,
        class_id: section.class_id,
        teacher_id: section.teacher_id
      })
      .eq('id', section.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Section updated successfully!',
      });
      setEditingSection(null);
      fetchSections();
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (confirm('Are you sure you want to delete this class? This will also delete all associated sections.')) {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Class deleted successfully!',
        });
        fetchClasses();
        fetchSections();
      }
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', sectionId);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Section deleted successfully!',
        });
        fetchSections();
      }
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="classes" className="w-full">
        <TabsList>
          <TabsTrigger value="classes">Manage Classes</TabsTrigger>
          <TabsTrigger value="sections">Manage Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Class</CardTitle>
                <CardDescription>Create a new class/grade</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddClass} className="space-y-4">
                  <div>
                    <Label htmlFor="class_name">Class Name</Label>
                    <Input
                      id="class_name"
                      value={newClass.name}
                      onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                      placeholder="e.g., Grade 1, Class A"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="class_description">Description</Label>
                    <Input
                      id="class_description"
                      value={newClass.description}
                      onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Class
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Classes</CardTitle>
                <CardDescription>Manage existing classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.map((cls: any) => (
                        <TableRow key={cls.id}>
                          {editingClass?.id === cls.id ? (
                            <>
                              <TableCell>
                                <Input
                                  value={editingClass.name}
                                  onChange={(e) => setEditingClass({...editingClass, name: e.target.value})}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editingClass.description}
                                  onChange={(e) => setEditingClass({...editingClass, description: e.target.value})}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleUpdateClass(editingClass)}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingClass(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>{cls.name}</TableCell>
                              <TableCell>{cls.description}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingClass(cls)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteClass(cls.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
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
          </div>
        </TabsContent>

        <TabsContent value="sections">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Section</CardTitle>
                <CardDescription>Create a new section within a class</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSection} className="space-y-4">
                  <div>
                    <Label htmlFor="section_name">Section Name</Label>
                    <Input
                      id="section_name"
                      value={newSection.name}
                      onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                      placeholder="e.g., A, B, Blue, Red"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="section_class">Class</Label>
                    <Select
                      value={newSection.class_id}
                      onValueChange={(value) => setNewSection({ ...newSection, class_id: value })}
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
                    <Label htmlFor="section_teacher">Assign Teacher</Label>
                    <Select
                      value={newSection.teacher_id}
                      onValueChange={(value) => setNewSection({ ...newSection, teacher_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher: any) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Sections</CardTitle>
                <CardDescription>Manage existing sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sections.map((section: any) => (
                        <TableRow key={section.id}>
                          {editingSection?.id === section.id ? (
                            <>
                              <TableCell>
                                <Input
                                  value={editingSection.name}
                                  onChange={(e) => setEditingSection({...editingSection, name: e.target.value})}
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={editingSection.class_id}
                                  onValueChange={(value) => setEditingSection({...editingSection, class_id: value})}
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
                                  value={editingSection.teacher_id}
                                  onValueChange={(value) => setEditingSection({...editingSection, teacher_id: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teachers.map((teacher: any) => (
                                      <SelectItem key={teacher.id} value={teacher.id}>
                                        {teacher.full_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleUpdateSection(editingSection)}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>{section.name}</TableCell>
                              <TableCell>{section.classes?.name}</TableCell>
                              <TableCell>{section.profiles?.full_name || 'Unassigned'}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingSection(section)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteSection(section.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClassSectionManager;
