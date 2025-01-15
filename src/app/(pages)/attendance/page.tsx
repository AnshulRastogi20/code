'use client'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  CircularProgress,
  Box,
  Card
} from '@mui/material'
import AppTheme from '@/components/shared-theme/AppTheme'
import * as React from 'react';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import type {} from '@mui/x-charts/themeAugmentation';
import type {} from '@mui/x-data-grid/themeAugmentation';
import type {} from '@mui/x-tree-view/themeAugmentation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import MainGrid from '@/components/ui/material/MainGrid';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '@/components/shared-theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [fromDate, setFromDate] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [tillDate, setTillDate] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [showAll, setShowAll] = useState(true);

  const fetchAttendance = useCallback(async () => {
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
  }, [fromDate, tillDate, showAll]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAttendance();
    }
  }, [status, showAll, fetchAttendance]);


  if (loading) return (
    <AppTheme>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    </AppTheme>
  );

  return (
    <AppTheme  themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        {/* Main content */}
        <Card
          variant='outlined'
          component="main"
          sx={(theme) => ({
            border: 0,
            flexGrow: 1,
            backgroundColor: alpha(theme.palette.background.default, 1),
            overflow: 'auto',
            transition: 'all 0.3s ease',
            '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            {/* <Header /> */}
            <MainGrid />
          </Stack>
        </Card>
      </Box>
    </AppTheme>
  );
}
