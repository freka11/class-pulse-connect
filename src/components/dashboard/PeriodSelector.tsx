
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Period {
  id: number;
  period_number: number;
  name: string;
  start_time: string;
  end_time: string;
}

interface PeriodSelectorProps {
  periods: Period[];
  selectedPeriods: number[];
  onPeriodsChange: (periods: number[]) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  periods,
  selectedPeriods,
  onPeriodsChange,
}) => {
  const handlePeriodToggle = (periodNumber: number, checked: boolean) => {
    if (checked) {
      onPeriodsChange([...selectedPeriods, periodNumber].sort());
    } else {
      onPeriodsChange(selectedPeriods.filter(p => p !== periodNumber));
    }
  };

  const handleSelectAll = () => {
    if (selectedPeriods.length === periods.length) {
      onPeriodsChange([]);
    } else {
      onPeriodsChange(periods.map(p => p.period_number));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Select Periods
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {selectedPeriods.length === periods.length ? 'Deselect All' : 'Select All'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {periods.map((period) => (
            <div key={period.id} className="flex items-center space-x-2">
              <Checkbox
                id={`period-${period.period_number}`}
                checked={selectedPeriods.includes(period.period_number)}
                onCheckedChange={(checked) => 
                  handlePeriodToggle(period.period_number, checked as boolean)
                }
              />
              <label
                htmlFor={`period-${period.period_number}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <div>{period.name}</div>
                <div className="text-xs text-gray-500">
                  {period.start_time} - {period.end_time}
                </div>
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PeriodSelector;
