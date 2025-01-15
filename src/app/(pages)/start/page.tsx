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
  CssBaseline,
  Card,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { PlayArrow, Cancel, AccessTime, Event } from '@mui/icons-material'
import { Period, DaySchedule, allClasses } from '@/types'
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
  const { data: session, status, update: updateSession } = useSession()
  const [todayClasses, setTodayClasses] = useState<Period[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHoliday, setIsHoliday] = useState(false)

  const today = new Date()
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()]
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(today)

  // Memoize both the fetch function and navigation handling
  const handleTimetableNotFound = () => {
    toast.error('No timetable found. Please create one first.')
    router.push('/timetable')
  }

  const fetchTodayClasses = async () => {
    try {
      const [timetableRes, classInfoRes] = await Promise.all([
        axios.get('/api/user/timetable'),
        axios.get('/api/calendar')
      ])

      if (!timetableRes.data || !timetableRes.data.schedule) {
        setTodayClasses([])
        setIsLoading(false)
        handleTimetableNotFound()
        return
      }

      const todaySchedule = timetableRes.data.schedule.find((day: DaySchedule) => 
        day.day.toUpperCase() === dayName.toUpperCase()
      )

      // Check if today is marked as holiday
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      const todayClasses = classInfoRes.data.calendarData.filter(
        (cls:allClasses) => new Date(cls.date).toDateString() === todayDate.toDateString()
      )
      
      setIsHoliday(todayClasses.length > 0 && todayClasses.every((cls: allClasses) => cls.isHoliday))
      setTodayClasses(todaySchedule?.periods || [])
    } catch (error) {
      console.error('Failed:', error)
      setTodayClasses([])
      if (axios.isAxiosError(error)) {
        // Handle both 404 and 408 errors
        if (error.response?.status === 404 || error.response?.status === 408) {
          handleTimetableNotFound()
        } else {
          toast.error('Failed to load today\'s classes')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Authentication effect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
    }
  }, [status, router])

  // Data fetching effect with stable dependency
  useEffect(() => {
    const currentDayName = dayName // Capture current value
    if (currentDayName) {
      fetchTodayClasses()
    }
  }) // Empty dependency array since we capture dayName value

  const handleStartDay = async () => {
    try {
      // First make the API call
      await axios.post('/api/start', { action: 'startDay' });
      
      // Then update the session and wait for it to complete
      await updateSession({
        user: {
          ...session?.user,
          isDateStarted: true,
        }
      });

      // Only redirect after both operations are complete
      toast.success('Day started successfully');
      router.refresh(); // Add this to force a refresh
      router.push('/schedule');
    } catch (error) {
      console.error('Failed:', error);
      toast.error('Failed to start day');
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
                <Card
                variant='outlined'
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
                </Card>
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
            {isHoliday ? (
              <Button
                variant="contained"
                size="large"
                disabled
                startIcon={<Cancel />}
                sx={{
                  minWidth: { xs: '100%', sm: 200 },
                  py: 1.5,
                }}
              >
                Today is marked as Holiday
              </Button>
            ) : (
              <>
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
              </>
            )}
          </Box>
        </Box>
      </Container>
    </AppTheme>
  )
}
