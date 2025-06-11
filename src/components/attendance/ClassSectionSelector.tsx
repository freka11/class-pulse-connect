
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
            <SelectValue placeholder={classesLoading ? "Loading classes..." : "Select a class"} />
          </SelectTrigger>
          <SelectContent>
            {classesLoading ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading classes...</div>
            ) : classes && classes.length > 0 ? (
              classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No classes available</div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="section-select">Section</Label>
        <Select value={selectedSection} onValueChange={onSectionChange} disabled={!selectedClass}>
          <SelectTrigger id="section-select">
            <SelectValue placeholder={
              !selectedClass 
                ? "Select a class first" 
                : sectionsLoading 
                  ? "Loading sections..." 
                  : "Select a section"
            } />
          </SelectTrigger>
          <SelectContent>
            {sectionsLoading ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading sections...</div>
            ) : sections && sections.length > 0 ? (
              sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No sections available</div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ClassSectionSelector;
