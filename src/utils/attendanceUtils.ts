
interface AttendanceRecord {
  status: 'present' | 'absent' | 'late';
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export const calculateAttendanceStats = (records: AttendanceRecord[]): AttendanceStats => {
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const total = records.length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    present,
    absent,
    late,
    total,
    percentage
  };
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'present':
      return 'text-green-600';
    case 'absent':
      return 'text-red-600';
    case 'late':
      return 'text-yellow-600';
    default:
      return '';
  }
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

export const validatePeriod = (period: number): boolean => {
  return period > 0 && period <= 12;
};

export const validateAttendanceDate = (date: string): boolean => {
  try {
    const attendanceDate = new Date(date);
    const today = new Date();
    return attendanceDate <= today;
  } catch {
    return false;
  }
};
