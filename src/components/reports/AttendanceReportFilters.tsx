
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Download, RefreshCw } from 'lucide-react';

interface AttendanceReportFiltersProps {
  startDate: string;
  endDate: string;
  selectedClass: string;
  classes: Array<{ id: string; name: string }>;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClassChange: (classId: string) => void;
  onApplyFilters: () => void;
  onExportReport: () => void;
  onRefresh: () => void;
  loading: boolean;
}

const AttendanceReportFilters: React.FC<AttendanceReportFiltersProps> = ({
  startDate,
  endDate,
  selectedClass,
  classes,
  onStartDateChange,
  onEndDateChange,
  onClassChange,
  onApplyFilters,
  onExportReport,
  onRefresh,
  loading,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Report Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="classFilter">Class</Label>
            <Select value={selectedClass} onValueChange={onClassChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end gap-2">
            <Button 
              onClick={onApplyFilters} 
              disabled={loading}
              className="flex-1"
            >
              Apply Filters
            </Button>
            <Button 
              variant="outline" 
              onClick={onRefresh}
              disabled={loading}
              size="icon"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              onClick={onExportReport}
              disabled={loading}
              size="icon"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceReportFilters;
