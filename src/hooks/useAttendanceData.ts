import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import dayjs, { Dayjs } from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import { SubjectAttendance } from '@/types';


dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);




export const useAttendanceData = () => {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [tillDate, setTillDate] = useState<Dayjs | null>(null);
  const [showAll, setShowAll] = useState(true);
  const [targetPercentage, setTargetPercentage] = useState<number>(75);


  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const params = showAll ? {} : {
        fromDate: fromDate?.format('YYYY-MM-DD'),
        tillDate: tillDate?.format('YYYY-MM-DD')
      };
      const { data } = await axios.get('/api/attendance/get', { params });
      setSubjects(data);
    } catch (error) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [fromDate, tillDate, showAll]);

  const calculateWeekWiseAttendance = async (month: Dayjs) => {
    try {
      const startOfMonth = month.startOf('month');
      const endOfMonth = month.endOf('month');
      
      const { data } = await axios.get('/api/attendance/get', {
        params: {
          fromDate: startOfMonth.format('YYYY-MM-DD'),
          tillDate: endOfMonth.format('YYYY-MM-DD')
        }
      });

      // Group classes by week
      const weeklyData: { [key: string]: { total: number; attended: number } } = {};
      
      data.forEach((subject: SubjectAttendance) => {
        const classDate = dayjs(subject.date);
        const weekNum = classDate.week();
        
        if (!weeklyData[weekNum]) {
          weeklyData[weekNum] = { total: 0, attended: 0 };
        }
        
        weeklyData[weekNum].total += subject.total;
        weeklyData[weekNum].attended += subject.attended;
      });

      // Calculate percentages for each week
      const weeklyPercentages = Object.keys(weeklyData).map(week => {
        const { total, attended } = weeklyData[week];
        return {
          week: `Week ${week}`,
          percentage: total > 0 ? (attended / total) * 100 : 0
        };
      });

      return weeklyPercentages;
    } catch (error) {
      console.error('Error calculating weekly attendance:', error);
      return [];
    }
  };

  const handleDateFilter = () => {
    if (fromDate && tillDate) {
      setShowAll(false);
      fetchAttendance();
    } else {
      toast.error('Please select both dates');
    }
  };

  const resetFilter = () => {
    setFromDate(null);
    setTillDate(null);
    setShowAll(true);
    fetchAttendance();
  };

  return {
    subjects,
    loading,
    fromDate,
    tillDate,
    setFromDate,
    setTillDate,
    handleDateFilter,
    resetFilter,
    fetchAttendance,
    calculateWeekWiseAttendance,
    targetPercentage,
    setTargetPercentage
  };
};