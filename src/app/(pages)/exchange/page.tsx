'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface Period {
  subject: string;
  startTime: string;
  endTime: string;
  endDate?: string; // Add this
}

interface DaySchedule {
  day: string;
  periods: Period[];
}

interface Timetable {
  schedule: DaySchedule[];
}

export default function ExchangePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [firstPeriod, setFirstPeriod] = useState({ day: '', startTime: '', endTime: '' });
  const [secondPeriod, setSecondPeriod] = useState({ day: '', startTime: '', endTime: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await fetch('/api/user/timetable');
        if (response.ok) {
          const data = await response.json();
          setTimetable(data);
        }
      } catch (error) {
        console.error('Failed to fetch timetable:', error);
      }
    };

    if (session) {
      fetchTimetable();
    }
  }, [session]);

  const handleExchange = async () => {
    if (!firstPeriod.day || !secondPeriod.day) {
      setError('Please select both periods');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/exchange-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firstPeriod, 
          secondPeriod,
          endDate: endDate || null 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange periods');
      }

      await axios.post('/api/start', { action: 'startDay' })

      router.refresh();
      setError('');
      toast.success('Periods exchanged successfully!');

      // Reset selections after successful exchange
      setFirstPeriod({ day: '', startTime: '', endTime: '' });
      setSecondPeriod({ day: '', startTime: '', endTime: '' });
      setEndDate('');
    } catch (error) {
      setError('Failed to exchange periods');
      toast.error('Failed to exchange periods');
    } finally {
      setLoading(false);
    }
  };

  if (!timetable) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white/10 backdrop-blur-sm shadow-lg rounded-xl border border-gray-700">
      <h1 className="text-3xl font-bold mb-6 text-white text-center">Exchange Periods</h1>
      
      <div className="space-y-6">
        <div className="border border-gray-700 p-6 rounded-xl bg-white/5 shadow-lg hover:shadow-xl transition-all">
          <h2 className="text-xl font-semibold mb-4 text-black">First Period</h2>
          <select
            className="w-full mb-3 p-2.5 border border-gray-700 rounded-lg text-white bg-black/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={firstPeriod.day}
            onChange={(e) => setFirstPeriod({ ...firstPeriod, day: e.target.value })}
          >
            <option value="">Select Day</option>
            {timetable.schedule.map((day) => (
              <option key={day.day} value={day.day}>{day.day}</option>
            ))}
          </select>

          {firstPeriod.day && (
            <select
              className="w-full p-2.5 border border-gray-700 rounded-lg text-white bg-black/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={`${firstPeriod.startTime}-${firstPeriod.endTime}`}
              onChange={(e) => {
                const [startTime, endTime] = e.target.value.split('-');
                setFirstPeriod({ ...firstPeriod, startTime, endTime });
              }}
            >
              <option value="">Select Period</option>
              {timetable.schedule
                .find(d => d.day === firstPeriod.day)
                ?.periods.map((period, i) => (
                  <option 
                    key={i} 
                    value={`${period.startTime}-${period.endTime}`}
                  >
                    {period.subject} ({period.startTime} - {period.endTime})
                  </option>
                ))}
            </select>
          )}
        </div>

        <div className="border border-gray-700 p-6 rounded-xl bg-white/5 shadow-lg hover:shadow-xl transition-all">
          <h2 className="text-xl font-semibold mb-4 text-black">Second Period</h2>
          <select
            className="w-full mb-3 p-2.5 border border-gray-700 rounded-lg text-white bg-black/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={secondPeriod.day}
            onChange={(e) => setSecondPeriod({ ...secondPeriod, day: e.target.value })}
          >
            <option value="">Select Day</option>
            {timetable.schedule.map((day) => (
              <option key={day.day} value={day.day}>{day.day}</option>
            ))}
          </select>

          {secondPeriod.day && (
            <select
              className="w-full p-2.5 border border-gray-700 rounded-lg text-white bg-black/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={`${secondPeriod.startTime}-${secondPeriod.endTime}`}
              onChange={(e) => {
                const [startTime, endTime] = e.target.value.split('-');
                setSecondPeriod({ ...secondPeriod, startTime, endTime });
              }}
            >
              <option value="">Select Period</option>
              {timetable.schedule
                .find(d => d.day === secondPeriod.day)
                ?.periods.map((period, i) => (
                  <option 
                    key={i} 
                    value={`${period.startTime}-${period.endTime}`}
                  >
                    {period.subject} ({period.startTime} - {period.endTime})
                  </option>
                ))}
            </select>
          )}
        </div>

        <div className="border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow mt-4">
          <h2 className="text-xl font-semibold mb-4 text-black">Exchange Duration</h2>
          <div className="flex items-center gap-4">
            <input
              type="date"
              className="flex-1 p-2.5 border rounded-md text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <button
              className="text-blue-500 hover:text-blue-600"
              onClick={() => setEndDate('')}
            >
              Clear
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Leave empty for permanent exchange
          </p>
        </div>

        {error && <p className="text-red-500 text-center font-medium">{error}</p>}
        
        <button
          className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 
                     transition-colors duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
          onClick={handleExchange}
          disabled={loading || !firstPeriod.day || !secondPeriod.day}
        >
          {loading ? 'Exchanging...' : 'Exchange Periods'}
        </button>
      </div>
    </div>
  );
}
