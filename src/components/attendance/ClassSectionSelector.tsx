
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClassSectionSelectorProps {
  selectedClass: string;
  selectedSection: string;
  onClassChange: (classId: string) => void;
  onSectionChange: (sectionId: string) => void;
}

const ClassSectionSelector: React.FC<ClassSectionSelectorProps> = ({
  selectedClass,
  selectedSection,
  onClassChange,
  onSectionChange,
}) => {
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('class_id', selectedClass)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClass,
  });

  const handleClassChange = (classId: string) => {
    onClassChange(classId);
    onSectionChange(''); // Reset section when class changes
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="class-select">Class</Label>
        <Select value={selectedClass} onValueChange={handleClassChange}>
          <SelectTrigger id="class-select">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classesLoading ? (
              <SelectItem value="" disabled>Loading classes...</SelectItem>
            ) : (
              classes?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="section-select">Section</Label>
        <Select value={selectedSection} onValueChange={onSectionChange} disabled={!selectedClass}>
          <SelectTrigger id="section-select">
            <SelectValue placeholder="Select a section" />
          </SelectTrigger>
          <SelectContent>
            {sectionsLoading ? (
              <SelectItem value="" disabled>Loading sections...</SelectItem>
            ) : sections?.length === 0 ? (
              <SelectItem value="" disabled>No sections available</SelectItem>
            ) : (
              sections?.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ClassSectionSelector;
