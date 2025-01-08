'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Badge } from "@/components/ui/badge"

interface SubjectAttendance {
  name: string;
  total: number;
  attended: number;
  percentage: number;
  temporarySubject?: boolean;
  originalSubject?: string;
}

export default function AttendancePage() {
  const { status } = useSession();
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [tillDate, setTillDate] = useState('');
  const [showAll, setShowAll] = useState(true);

  const fetchAttendance =  useCallback(async () => {
    
    try {
      setLoading(true);
      const params = showAll ? {} : {
        fromDate: fromDate || undefined,
        tillDate: tillDate || undefined
      };
      const { data } = await axios.get('/api/attendance/get', { params });
      setSubjects(data);
    } catch (error) {
      toast.error('Failed to load attendance data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, tillDate, showAll, setSubjects, setLoading]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAttendance();
    }
  }, [status, showAll , fetchAttendance]);

  const handleDateChange = () => {
    if (fromDate && tillDate) {
      setShowAll(false);
      fetchAttendance();
    } else {
      toast.error('Please select both dates');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-4">Attendance Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white
                         focus:ring-2 focus:ring-white/50 focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Till Date</label>
            <input
              type="date"
              value={tillDate}
              onChange={(e) => setTillDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white
                         focus:ring-2 focus:ring-white/50 focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={handleDateChange}
            className="px-6 py-2.5 bg-white text-blue-600 rounded-lg font-medium
                     hover:bg-blue-50 transform hover:scale-105 transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
          >
            Apply Filter
          </button>
          <button
            onClick={() => {
              setShowAll(true);
              setFromDate('');
              setTillDate('');
            }}
            className="px-6 py-2.5 bg-blue-900 text-white rounded-lg font-medium
                     hover:bg-blue-800 transform hover:scale-105 transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
          >
            Show All Time
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-6 text-gray-600">Subject</th>
                <th className="text-center p-6 text-gray-600">Classes Happened</th>
                <th className="text-center p-6 text-gray-600">Classes Attended</th>
                <th className="text-center p-6 text-gray-600">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr 
                  key={index}
                  className={`
                    border-t border-gray-100 hover:bg-gray-50 transition-colors
                    ${subject.percentage < 75 ? 'bg-red-50' : ''}
                  `}
                >
                  <td className="p-6 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {subject.name}
                      {subject.temporarySubject && (
                        <Badge 
                          variant="outline" 
                          className="cursor-help"
                          title={`Exchanged with ${subject.originalSubject}`}
                        >
                          Exchange
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="text-center p-6 text-gray-600">{subject.total}</td>
                  <td className="text-center p-6 text-gray-600">{subject.attended}</td>
                  <td className="text-center p-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium
                      ${subject.percentage >= 75 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'}`}>
                      {subject.percentage.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {subjects.length > 0 && (
                <tr className="bg-gray-50 font-semibold">
                  <td className="p-6 text-gray-900">Overall</td>
                  <td className="text-center p-6 text-gray-900">
                    {subjects.reduce((acc, curr) => acc + curr.total, 0)}
                  </td>
                  <td className="text-center p-6 text-gray-900">
                    {subjects.reduce((acc, curr) => acc + curr.attended, 0)}
                  </td>
                  <td className="text-center p-6">
                    {(() => {
                      const totalClasses = subjects.reduce((acc, curr) => acc + curr.total, 0);
                      const totalAttended = subjects.reduce((acc, curr) => acc + curr.attended, 0);
                      const overallPercentage = (totalAttended / totalClasses) * 100;
                      return (
                        <span className={`inline-flex items-center px-4 py-2 rounded-full font-bold
                          ${overallPercentage >= 75
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'}`}>
                          {overallPercentage.toFixed(1)}%
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No attendance data available</div>
        </div>
      )}
    </div>
  );
}

