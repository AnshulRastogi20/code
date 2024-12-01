// utils/attendance.ts
export const calculateAttendance = (periods: any[]) => {
    const total = periods.filter(p => !p.disabled).length;
    const attended = periods.filter(p => p.attended && !p.disabled).length;
    
    return {
      total,
      attended,
      percentage: total ? (attended / total) * 100 : 0
    };
  };
  
  export const getSubjectWiseAttendance = (attendanceRecords: any[]) => {
    const subjectMap = new Map();
  
    attendanceRecords.forEach(record => {
      record.periods.forEach((period: any) => {
        if (!subjectMap.has(period.subject)) {
          subjectMap.set(period.subject, {
            total: 0,
            attended: 0,
            disabled: 0
          });
        }
  
        const stats = subjectMap.get(period.subject);
        if (!period.disabled) {
          stats.total++;
          if (period.attended) stats.attended++;
        } else {
          stats.disabled++;
        }
      });
    });
  
    return Array.from(subjectMap.entries()).map(([subject, stats]) => ({
      subject,
      ...stats,
      percentage: calculateAttendance([stats]).percentage
    }));
  };