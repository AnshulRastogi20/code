'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Grid,
  useTheme,
  CssBaseline,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { PlayArrow, Cancel, AccessTime, Event } from '@mui/icons-material'
import { Period, DaySchedule } from '@/types'
import AppTheme from '@/components/shared-theme/AppTheme'
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
} from '@/components/shared-theme/customizations'

const themeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
}

export default function StartPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [todayClasses, setTodayClasses] = useState<Period[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const today = new Date()
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()]
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(today)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
    }
  }, [status, router,session])

  useEffect(() => {
    const fetchTodayClasses = async () => {
      try {
        const { data } = await axios.get('/api/user/timetable')
        const todaySchedule = data.schedule.find((day: DaySchedule) => 
          day.day.toUpperCase() === dayName.toUpperCase()
        )
        setTodayClasses(todaySchedule?.periods || [])
      } catch (error) {
        console.error('Failed:', error)
        toast.error('Failed to load today\'s classes')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTodayClasses()
  }, [dayName])

  const handleStartDay = async () => {
    try {
      await axios.post('/api/start', { action: 'startDay' })
      toast.success('Day started successfully')
      router.push('/schedule')
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Failed to start day')
    }
  }

  const handleMarkHoliday = async () => {
    try {
      await axios.post('/api/start', { action: 'markHoliday' })
      toast.success('Day marked as holiday')
      router.push('/schedule')
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Failed to mark holiday')
    }
  }

  if (isLoading) {
    return (
      <AppTheme themeComponents={themeComponents}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </AppTheme>
    )
  }

  return (
    <AppTheme themeComponents={themeComponents}>
      <CssBaseline enableColorScheme />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {/* Header Section */}
          <Box textAlign="center">
            <Typography variant="h3" component="h1" gutterBottom>
              Today&apos;s Schedule
            </Typography>
            <Typography variant="h5" color="text.secondary">
              {dayName}, {today.getDate()} {monthName}
            </Typography>
          </Box>

          {/* Classes Grid */}
          <Grid container spacing={3}>
            {todayClasses.map((period, index) => (
              <Grid item xs={12} key={index}>
                <Box
                  sx={(theme) => ({
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.default, 1),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
                  })}
                >
                  <Typography variant="h5" component="h3" gutterBottom>
                    {period.subject}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 4,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime color="action" />
                      <Typography variant="body1" color="text.secondary">
                        {period.startTime} - {period.endTime}
                      </Typography>
                    </Box>
                    {period.teacher && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Event color="action" />
                        <Typography variant="body1" color="text.secondary">
                          {period.teacher}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mt: 4,
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleStartDay}
              startIcon={<PlayArrow />}
              sx={{
                minWidth: { xs: '100%', sm: 200 },
                py: 1.5,
              }}
            >
              Start Today&apos;s Day
            </Button>
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={handleMarkHoliday}
              startIcon={<Cancel />}
              sx={{
                minWidth: { xs: '100%', sm: 200 },
                py: 1.5,
              }}
            >
              Mark as Holiday
            </Button>
          </Box>
        </Box>
      </Container>
    </AppTheme>
  )
}
