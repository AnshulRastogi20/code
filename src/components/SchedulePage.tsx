// components/SchedulePage.tsx
'use client'
import { useAttendance } from '@/hooks/useAppData';
import { Period } from '@/types';

export default function SchedulePage() {
  const { attendance, isLoading, error, markAttendance } = useAttendance();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading schedule</div>;

  return (
    <div>
      {attendance?.map((period: Period) => (
        <div key={period.id}>
          <h3>{period.subject}</h3>
          <input
            type="checkbox"
            checked={period.attended}
            onChange={(e) => markAttendance({
              periodId: period.id,
              attended: e.target.checked
            })}
          />
        </div>
      ))}
    </div>
  );
}