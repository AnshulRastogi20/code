import * as React from 'react';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Copyright from '@/components/ui/material/Copyright';
import AttendanceGrid from './AttendanceGrid';

import StatCard, { StatCardProps } from './StatCard';
import ChartUserBySub from './ChartUserBySub';
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppTheme from '@/components/shared-theme/AppTheme';
import CircularProgress from '@mui/material/CircularProgress';

export default function MainGrid() {

  const { status } = useSession();
  const {
    subjects,
    loading,
    fetchAttendance,
    targetPercentage, 
  } = useAttendanceData();

  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAttendance();
    }
  }, [status, fetchAttendance]);

  const totalClasses = subjects.reduce((acc, curr) => acc + curr.total, 0);
  const totalAttended = subjects.reduce((acc, curr) => acc + curr.attended, 0);
  const overallPercentage = (totalAttended / totalClasses) * 100;
  const margin = targetPercentage < overallPercentage ? (overallPercentage-targetPercentage) : (overallPercentage-targetPercentage);
  const trend = targetPercentage < overallPercentage ? 'up' : (targetPercentage > overallPercentage ?'down' : 'neutral');
  if (loading) return (
      <AppTheme>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );



const data: StatCardProps[] = [
  {
    title: 'TOTAL %',
    value: overallPercentage.toFixed(2).toString(),
    interval: 'All Time',
    trend: trend,
    data: [
      // 200, 24, 220, 260, 240, 380, 100, 240, 280, 240, 300, 340, 320, 360, 340, 380,
      // 360, 400, 380, 420, 400, 640, 340, 460, 440, 480, 460, 600, 880, 920,
    ],
  },
  {
    title: 'Total Happened Classes',
    value: totalClasses.toString(),
    interval: 'All Time',
    trend: 'neutral',
    data: [
      // 1640, 1250, 970, 1130, 1050, 900, 720, 1080, 900, 450, 920, 820, 840, 600, 820,
      // 780, 800, 760, 380, 740, 660, 620, 840, 500, 520, 480, 400, 360, 300, 220,
    ],
  },
  {
    title: 'Total Attended Classes',
    value: totalAttended.toString(),
    interval: 'All Time',
    trend: 'neutral',
    data: [
      // 500, 400, 510, 530, 520, 600, 530, 520, 510, 730, 520, 510, 530, 620, 510, 530,
      // 520, 410, 530, 520, 610, 530, 520, 610, 530, 420, 510, 430, 520, 510,
    ],
  },
];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* cards */}
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Attendance Dashboard
      </Typography>
      <Grid
        container
        spacing={2}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >
        {data.map((card, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard {...card } />
          </Grid>
        ))}
       <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          {/* <HighlightedCard /> */}
        </Grid> 
        
          {/* <Grid size={{ xs: 12, md: 6 }}>
          <SessionsChart />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PageViewsBarChart />
        </Grid> */}
      </Grid>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Details
      </Typography>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <AttendanceGrid />
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack gap={2} direction={{ xs: 'column', sm: 'row', lg: 'column' }}>
            {/* <CustomizedTreeView /> */}
            <ChartUserBySub />
          </Stack>
        </Grid>
      </Grid>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
