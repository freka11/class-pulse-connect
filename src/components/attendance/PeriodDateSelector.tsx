
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';

interface PeriodDateSelectorProps {
  selectedDate: Date;
  selectedPeriods: number[];
  onDateChange: (date: Date) => void;
  onPeriodsChange: (periods: number[]) => void;
}

const PeriodDateSelector: React.FC<PeriodDateSelectorProps> = ({
  selectedDate,
  selectedPeriods,
  onDateChange,
  onPeriodsChange,
}) => {
  const { data: periods, isLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periods')
        .select('*')
        .order('period_number');
      
      if (error) throw error;
      return data;
    },
  });

  const handlePeriodToggle = (periodNumber: number) => {
    const newPeriods = selectedPeriods.includes(periodNumber)
      ? selectedPeriods.filter(p => p !== periodNumber)
      : [...selectedPeriods, periodNumber].sort((a, b) => a - b);
    onPeriodsChange(newPeriods);
  };

  const handleSelectAllPeriods = () => {
    if (!periods) return;
    const allPeriods = periods.map(p => p.period_number);
    onPeriodsChange(selectedPeriods.length === periods.length ? [] : allPeriods);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Periods</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAllPeriods}
            disabled={isLoading || !periods?.length}
          >
            {selectedPeriods.length === periods?.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading periods...</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {periods?.map((period) => (
              <div key={period.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`period-${period.period_number}`}
                  checked={selectedPeriods.includes(period.period_number)}
                  onCheckedChange={() => handlePeriodToggle(period.period_number)}
                />
                <Label
                  htmlFor={`period-${period.period_number}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {period.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PeriodDateSelector;
