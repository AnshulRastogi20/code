import * as React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Box , CircularProgress} from '@mui/material';
import { SubjectAttendance } from '@/types';
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';



export default function ChartUserBySub() {


const { status } = useSession();
  const {
    subjects,
    loading,
    fetchAttendance,

  } = useAttendanceData();

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAttendance();
    }
  }, [status, fetchAttendance]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }


const getChartData = (subjects: SubjectAttendance[]) => {
  return subjects.map((subject) => {
    return {
      label: subject.name,
      value: subject.attended,
    };
  });
};


const data = getChartData(subjects);





const getChartSubjects = (subjects: SubjectAttendance[]) => {
  const l= Math.floor(Math.random() * (100 - 20) + 20)
  return subjects.map((subject) => {
    return {
      name: subject.name,
      value: subject.percentage.toFixed(1),
      color: `hsl(220, 25%, ${l}%) `,
    };
  });
};

const subs = getChartSubjects(subjects);
console.log("SUBS - ", subs)
const colors = subs.map(sub => sub.color);



// const StyledText = styled('text', {
//   shouldForwardProp: (prop) => prop !== 'variant',
// })<StyledTextProps>(({ theme }) => ({
//   textAnchor: 'middle',
//   dominantBaseline: 'central',
//   fill: (theme).palette.text.secondary,
//   variants: [
//     {
//       props: {
//         variant: 'primary',
//       },
//       style: {
//         fontSize: theme.typography.h5.fontSize,
//       },
//     },
//     {
//       props: ({ variant }) => variant !== 'primary',
//       style: {
//         fontSize: theme.typography.body2.fontSize,
//       },
//     },
//     {
//       props: {
//         variant: 'primary',
//       },
//       style: {
//         fontWeight: theme.typography.h5.fontWeight,
//       },
//     },
//     {
//       props: ({ variant }) => variant !== 'primary',
//       style: {
//         fontWeight: theme.typography.body2.fontWeight,
//       },
//     },
//   ],
// }));

  return (
    <Card
      variant="outlined"
      sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}
    >
      <CardContent>
        <Typography component="h2" variant="subtitle2">
          Attendence By Subject
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PieChart
            colors={colors}
            margin={{
              left: 80,
              right: 80,
              top: 80,
              bottom: 80,
            }}
            series={[
              {
                data,
                innerRadius: 75,
                outerRadius: 100,
                paddingAngle: 0,
                highlightScope: { faded: 'global', highlighted: 'item' },
              },
            ]}
            height={260}
            width={260}
            slotProps={{
              legend: { hidden: true },
            }}
          >
          </PieChart>
        </Box>
      
      </CardContent>
    </Card>
  );
}
