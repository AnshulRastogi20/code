'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { toast } from 'sonner'

interface SubjectAttendance {
  name: string;
  total: number;
  attended: number;
  percentage: number;
}

export default function AttendancePage() {
  const { status } = useSession();
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data } = await axios.get('/api/attendance/get');
        setSubjects(data);
      } catch (error) {
        toast.error('Failed to load attendance data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchAttendance();
    }
  }, [status]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="border rounded-lg border-white/10 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left p-4">Subject</th>
            <th className="text-center p-4">Classes Happened</th>
            <th className="text-center p-4">Classes Attended</th>
            <th className="text-center p-4">Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject.name} className="border-b border-white/10">
              <td className="p-4">{subject.name}</td>
              <td className="text-center p-4">{subject.total}</td>
              <td className="text-center p-4">{subject.attended}</td>
              <td className="text-center p-4">{subject.percentage.toFixed(1)}%</td>
            </tr>
          ))}
          {subjects.length > 0 && (
            <tr>
              <td className="p-4 font-medium">Total</td>
              <td className="text-center p-4">{subjects.reduce((acc, curr) => acc + curr.total, 0)}</td>
              <td className="text-center p-4">{subjects.reduce((acc, curr) => acc + curr.attended, 0)}</td>
              <td className="text-center p-4">
                {(subjects.reduce((acc, curr) => acc + curr.percentage, 0) / subjects.length).toFixed(1)}%
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

