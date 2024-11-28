export default function AttendancePage() {
    const subjects = [
      { name: 'Mathematics', total: 40, attended: 35, percentage: 87.5 },
      { name: 'Physics', total: 38, attended: 30, percentage: 78.9 },
      { name: 'Chemistry', total: 42, attended: 38, percentage: 90.5 },
      { name: 'English', total: 42, attended: 38, percentage: 90.5 }
    ]
  
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
            <tr>
              <td className="p-4 font-medium">Total</td>
              <td className="text-center p-4">{subjects.reduce((acc, curr) => acc + curr.total, 0)}</td>
              <td className="text-center p-4">{subjects.reduce((acc, curr) => acc + curr.attended, 0)}</td>
              <td className="text-center p-4">
                {(subjects.reduce((acc, curr) => acc + curr.percentage, 0) / subjects.length).toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
  
  