
-- First, let's check and update the RLS policies for the students table
-- The issue is likely that admins need proper permissions to insert students

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Teachers can manage students in their sections" ON public.students;
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;

-- Create new policies that allow proper student management
-- Allow admins to manage all students
CREATE POLICY "Admins can manage all students" ON public.students
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Allow teachers to manage students in their sections (for insert/update/delete)
CREATE POLICY "Teachers can manage their section students" ON public.students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sections 
      WHERE sections.id = students.section_id 
      AND sections.teacher_id = auth.uid()
    ) OR public.get_current_user_role() = 'admin'
  );

-- Allow students to view their own profile only
CREATE POLICY "Students can view own profile" ON public.students
  FOR SELECT USING (students.user_id = auth.uid());

-- Ensure the user_id column can be null for students who don't have user accounts yet
-- This is important for student records created by admins/teachers
ALTER TABLE public.students ALTER COLUMN user_id DROP NOT NULL;
