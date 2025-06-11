
-- Create a view for attendance statistics to optimize report queries
CREATE OR REPLACE VIEW public.attendance_statistics AS
SELECT 
    c.id as class_id,
    c.name as class_name,
    s.id as section_id,
    s.name as section_name,
    COUNT(DISTINCT st.id) as total_students,
    COUNT(DISTINCT a.student_id) as students_with_attendance,
    COUNT(a.id) as total_attendance_records,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
    ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::decimal / 
         NULLIF(COUNT(a.id), 0)) * 100, 2
    ) as attendance_percentage
FROM public.classes c
LEFT JOIN public.sections s ON c.id = s.class_id
LEFT JOIN public.students st ON s.id = st.section_id
LEFT JOIN public.attendance a ON st.id = a.student_id
GROUP BY c.id, c.name, s.id, s.name;

-- Create a view for overall institution statistics
CREATE OR REPLACE VIEW public.institution_statistics AS
SELECT 
    COUNT(DISTINCT st.id) as total_students,
    COUNT(a.id) as total_attendance_records,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absent,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as total_late,
    ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::decimal / 
         NULLIF(COUNT(a.id), 0)) * 100, 2
    ) as overall_attendance_percentage
FROM public.students st
LEFT JOIN public.attendance a ON st.id = a.student_id;

-- Add additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date_range ON public.attendance(date, student_id);
CREATE INDEX IF NOT EXISTS idx_students_section_lookup ON public.students(section_id, class_id);

-- Add a function to get attendance report data with date filtering
CREATE OR REPLACE FUNCTION public.get_attendance_report(
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  class_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  class_id uuid,
  class_name text,
  section_id uuid,
  section_name text,
  total_students bigint,
  total_attendance_records bigint,
  present_count bigint,
  absent_count bigint,
  late_count bigint,
  attendance_percentage numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    c.id as class_id,
    c.name as class_name,
    s.id as section_id,
    s.name as section_name,
    COUNT(DISTINCT st.id) as total_students,
    COUNT(a.id) as total_attendance_records,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
    ROUND(
      (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::decimal / 
       NULLIF(COUNT(a.id), 0)) * 100, 2
    ) as attendance_percentage
  FROM public.classes c
  LEFT JOIN public.sections s ON c.id = s.class_id
  LEFT JOIN public.students st ON s.id = st.section_id
  LEFT JOIN public.attendance a ON st.id = a.student_id
    AND (start_date IS NULL OR a.date >= start_date)
    AND (end_date IS NULL OR a.date <= end_date)
  WHERE (class_filter IS NULL OR c.id = class_filter)
  GROUP BY c.id, c.name, s.id, s.name
  ORDER BY c.name, s.name;
$$;

-- Fix any potential data integrity issues
UPDATE public.attendance 
SET class_id = (SELECT class_id FROM public.students WHERE students.id = attendance.student_id)
WHERE class_id IS NULL AND student_id IS NOT NULL;

UPDATE public.attendance 
SET section_id = (SELECT section_id FROM public.students WHERE students.id = attendance.student_id)
WHERE section_id IS NULL AND student_id IS NOT NULL;
