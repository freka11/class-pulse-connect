
-- Enable Row Level Security on remaining tables (some might already be enabled)
DO $$
BEGIN
    -- Enable RLS only if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'attendance' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'classes' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'sections' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'students' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create security definer function to get user role (drop first if exists)
DROP FUNCTION IF EXISTS public.get_current_user_role();
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Teachers can manage attendance for their sections" ON public.attendance;
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can view their assigned classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage all classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their sections" ON public.sections;
DROP POLICY IF EXISTS "Teachers can manage students in their sections" ON public.students;
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
DROP POLICY IF EXISTS "All authenticated users can view periods" ON public.periods;

-- RLS Policies for attendance table
CREATE POLICY "Teachers can manage attendance for their sections" ON public.attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sections 
      WHERE sections.id = attendance.section_id 
      AND sections.teacher_id = auth.uid()
    ) OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Students can view their own attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students 
      WHERE students.id = attendance.student_id 
      AND students.user_id = auth.uid()
    )
  );

-- RLS Policies for classes table
CREATE POLICY "Teachers can view their assigned classes" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sections 
      WHERE sections.class_id = classes.id 
      AND sections.teacher_id = auth.uid()
    ) OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Admins can manage all classes" ON public.classes
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for sections table
CREATE POLICY "Teachers can manage their sections" ON public.sections
  FOR ALL USING (
    sections.teacher_id = auth.uid() OR public.get_current_user_role() = 'admin'
  );

-- RLS Policies for students table
CREATE POLICY "Teachers can manage students in their sections" ON public.students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sections 
      WHERE sections.id = students.section_id 
      AND sections.teacher_id = auth.uid()
    ) OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Students can view their own profile" ON public.students
  FOR SELECT USING (students.user_id = auth.uid());

-- RLS Policies for periods table
CREATE POLICY "All authenticated users can view periods" ON public.periods
  FOR SELECT TO authenticated USING (true);

-- Add indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_section_date ON public.attendance(class_id, section_id, date);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON public.students(class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_sections_teacher ON public.sections(teacher_id);

-- Add constraints for data integrity (only if they don't exist)
DO $$
BEGIN
    -- Add unique constraint for roll numbers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'students' 
        AND constraint_name = 'students_roll_no_class_section_unique'
    ) THEN
        ALTER TABLE public.students ADD CONSTRAINT students_roll_no_class_section_unique 
          UNIQUE (roll_no, class_id, section_id);
    END IF;

    -- Add date constraint for attendance
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'attendance' 
        AND constraint_name = 'attendance_date_not_future'
    ) THEN
        ALTER TABLE public.attendance ADD CONSTRAINT attendance_date_not_future 
          CHECK (date <= CURRENT_DATE);
    END IF;

    -- Add period validation constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'attendance' 
        AND constraint_name = 'attendance_period_valid'
    ) THEN
        ALTER TABLE public.attendance ADD CONSTRAINT attendance_period_valid 
          CHECK (period > 0 AND period <= 12);
    END IF;
END $$;
