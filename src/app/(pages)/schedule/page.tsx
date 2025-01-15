'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  Box,
  Stack,
  Typography,
  Button,
  Checkbox,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Drawer,
  IconButton,
  FormControlLabel,
  useTheme,
  alpha,
  Card,
} from '@mui/material'
import { DateCalendar } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { SwapHoriz, Add } from '@mui/icons-material'
import AppTheme from '@/components/shared-theme/AppTheme'
import Link from 'next/link'
import { allClasses, DaySchedule, Period, SubjectInfo } from '@/types'
import CssBaseline from '@mui/material/CssBaseline'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
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
dayjs.extend(utc)
dayjs.extend(timezone)

// ... keep existing interfaces and type definitions ...

export default function SchedulePage() {
  const theme = useTheme()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [changedPeriods, setChangedPeriods] = useState<{[key: string]: boolean}>({});
  const [timetable, setTimetable] = useState<DaySchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate] = useState(new Date()) // Initialize once
  const [dayName, setDayName] = useState('')
  const [monthName, setMonthName] = useState('')
  const [dateDisplay, setDateDisplay] = useState('')
  const [showHolidayConfirmation, setShowHolidayConfirmation] = useState(false);
  const [pendingEnableAction, setPendingEnableAction] = useState<{
    subject: string;
    startTime: string;
  } | null>(null);
  const [showAddClass, setShowAddClass] = useState(false)
  const [validTill, setValidTill] = useState<Date>()
  const [newClass, setNewClass] = useState({
    subject: '',
    startTime: '12:00',  // Set default times
    endTime: '13:00',
    startPeriod: 'PM',
    endPeriod: 'PM'
  })
  const [originalValues, setOriginalValues] = useState<{
    [key: string]: {
        attended?: boolean;
        topicsCovered?: string;
    };
  }>({});

  // Add new loading states
  const [loadingStates, setLoadingStates] = useState<{
    attendance: { [key: string]: boolean };
    disable: { [key: string]: boolean };
    topics: { [key: string]: boolean };
  }>({
    attendance: {},
    disable: {},
    topics: {},
  });

  useEffect(() => {
    const today = dayjs()
    setDayName(today.format('dddd'))
    setMonthName(today.format('MMMM'))
    setDateDisplay(today.format('D'))
  }, [selectedDate])

  const fetchTodaySchedule = useCallback(async () => {
    if (!dayName) return;
    
    try {
      setIsLoading(true)
      const [timetableRes, savedDataRes] = await Promise.all([
        axios.get('/api/user/timetable'),
        axios.get(`/api/schedule?date=${dayjs(selectedDate).toISOString()}`)
      ])

      const todaySchedule = timetableRes.data.schedule.find((day: DaySchedule) => 
        day.day.toUpperCase() === dayName.toUpperCase()
      )

      if (todaySchedule && savedDataRes.data.data) {
        const savedData = savedDataRes.data.data
        const mergedPeriods = todaySchedule.periods.map((period: Period) => {
          const savedSubject = savedData.find((s: SubjectInfo) => 
            s.name === period.subject &&
            s.allclasses.some((c: allClasses) => 
              new Date(c.date).toDateString() === selectedDate.toDateString() &&
              c.startTime === period.startTime  // Add this check
            )
          )

          if (savedSubject) {
            const savedClass = savedSubject.allclasses.find((c: allClasses) => 
              new Date(c.date).toDateString() === selectedDate.toDateString() &&
              c.startTime === period.startTime  // Add this check
            )
            
            return {
              ...period,
              attended: savedClass?.attended,
              happened: savedClass?.happened,
              isHoliday: savedClass?.isHoliday,
              disabled: !savedClass?.happened,
              topicsCovered: savedClass?.topicsCovered.join(', '),
              allAttended: savedSubject.allAttended,
              allHappened: savedSubject.allHappened
            }
          }
          return period
        })

        setTimetable({ ...todaySchedule, periods: mergedPeriods })
      } else {
        setTimetable(todaySchedule)
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
      toast.error('Failed to load schedule')
    } finally {
      setIsLoading(false)
    }
  }, [dayName, selectedDate])

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in');
    } else if (!session?.user?.isDateStarted) {
      router.push('/start');
    }
  }, [status, router, session]);

  useEffect(() => {
    fetchTodaySchedule()
  }, [fetchTodaySchedule])

  // Modified handleAttendanceChange with loading state
  const handleAttendanceChange = async (subject: string, attended: boolean, startTime: string) => {
    const key = `${subject}-${startTime}`;
    
    // Prevent action if already loading
    if (loadingStates.attendance[key]) return;

    // Set loading state
    setLoadingStates(prev => ({
      ...prev,
      attendance: { ...prev.attendance, [key]: true }
    }));

    // Store original value if not already stored
    if (!originalValues[key]) {
        const period = timetable?.periods.find(p => 
            p.subject === subject && p.startTime === startTime
        );
        setOriginalValues(prev => ({
            ...prev,
            [key]: { attended: period?.attended, topicsCovered: period?.topicsCovered }
        }));
    }

    setChangedPeriods(prev => ({
        ...prev,
        [key]: originalValues[key]?.attended !== attended
    }));
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Optional: minimum loading time
        const response = await axios.post('/api/attendance/update', {
            subjectName: subject,
            attended,
            date: selectedDate.toISOString(),
            startTime
        });
        
        // Update only the specific period that was changed
        if (timetable && response.data) {
            const updatedPeriods = timetable.periods.map(period => {
                if (period.subject === subject && period.startTime === startTime) {
                    return {
                        ...period,
                        allAttended: response.data.allAttended,
                        allHappened: response.data.allHappened,
                        attended
                    };
                }
                return period;
            });
            setTimetable({ ...timetable, periods: updatedPeriods });
        }
        
        toast.success('Attendance updated');
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Failed to update attendance');
        // Revert the checkbox state on error
        if (timetable) {
            const updatedPeriods = timetable.periods.map(period => {
                if (period.subject === subject && period.startTime === startTime) {
                    return {
                        ...period,
                        attended: !attended // revert to previous state
                    };
                }
                return period;
            });
            setTimetable({ ...timetable, periods: updatedPeriods });
        }
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        attendance: { ...prev.attendance, [key]: false }
      }));
    }
}

// Modify handleDisableClass function
const handleDisableClass = async (subject: string, shouldDisable: boolean, startTime: string) => {
  // If trying to enable a holiday class, show confirmation
  const period = timetable?.periods.find(p => p.subject === subject && p.startTime === startTime);
  if (!shouldDisable && period?.isHoliday) {
    setShowHolidayConfirmation(true);
    setPendingEnableAction({ subject, startTime });
    return;
  }

  await updateClassStatus(subject, shouldDisable, startTime);
}

// Modified handleDisableClass with loading state
const updateClassStatus = async (subject: string, shouldDisable: boolean, startTime: string) => {
  const key = `${subject}-${startTime}`;
    
  // Prevent action if already loading
  if (loadingStates.disable[key]) return;

  setLoadingStates(prev => ({
    ...prev,
    disable: { ...prev.disable, [key]: true }
  }));

  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // Optional: minimum loading time
    const response = await axios.post('/api/disableClass', {
      subjectName: subject,
      date: selectedDate.toISOString(),
      startTime,
      isDisabled: shouldDisable
    });

    // Update local state
    if (timetable) {
      const updatedPeriods = timetable.periods.map(period => {
        if (period.subject === subject && period.startTime === startTime) {
          return {
            ...period,
            disabled: shouldDisable,
            attended: shouldDisable ? false : period.attended,
            allHappened: response.data.allHappened,
            allAttended: response.data.allAttended
          };
        }
        return period;
      });
      setTimetable({ ...timetable, periods: updatedPeriods });
    }
    toast.success(shouldDisable ? 'Class disabled successfully' : 'Class enabled successfully');
  } catch (error) {
    toast.error(
      axios.isAxiosError(error) 
        ? error.response?.data?.error 
        : `Failed to ${shouldDisable ? 'disable' : 'enable'} class`
    );
  } finally {
    setLoadingStates(prev => ({
      ...prev,
      disable: { ...prev.disable, [key]: false }
    }));
  }
}

// Modified handleTopicsUpdate with loading state
const handleTopicsUpdate = async (subject: string, topics: string, startTime: string) => {
  const key = `${subject}-${startTime}`;
    
  // Prevent action if already loading
  if (loadingStates.topics[key]) return;

  setLoadingStates(prev => ({
    ...prev,
    topics: { ...prev.topics, [key]: true }
  }));

  // Store original value if not already stored
  if (!originalValues[key]) {
      const period = timetable?.periods.find(p => 
          p.subject === subject && p.startTime === startTime
      );
      setOriginalValues(prev => ({
          ...prev,
          [key]: { attended: period?.attended, topicsCovered: period?.topicsCovered }
      }));
  }

  setChangedPeriods(prev => ({
      ...prev,
      [key]: originalValues[key]?.topicsCovered !== topics
  }));
  
  // Update local state immediately
  if (timetable) {
    const updatedPeriods = timetable.periods.map(period => {
      if (period.subject === subject && period.startTime === startTime) {
        return {
          ...period,
          topicsCovered: topics
        };
      }
      return period;
    });
    setTimetable({ ...timetable, periods: updatedPeriods });
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // Optional: minimum loading time
    await axios.post('/api/attendance/topics', {
      subjectName: subject,
      topics,
      date: selectedDate.toISOString(),
      startTime
    })
    toast.success('Topics updated')
  } catch (error) {
    console.error('Failed:', error)

    toast.error('Failed to update topics')
  } finally {
    setLoadingStates(prev => ({
      ...prev,
      topics: { ...prev.topics, [key]: false }
    }));
  }
}

const handleSaveChanges = async (subject: string, startTime: string) => {
  const key = `${subject}-${startTime}`;
  try {
    const period = timetable?.periods.find(p => p.subject === subject && p.startTime === startTime);
    if (period) {
      await axios.post('/api/attendance/update', {
        subjectName: subject,
        attended: period.attended,
        topics: period.topicsCovered,
        date: selectedDate.toISOString(),
        startTime
      });
      
      // Update original values after successful save
      setOriginalValues(prev => ({
          ...prev,
          [key]: {
              attended: period.attended,
              topicsCovered: period.topicsCovered
          }
      }));
      setChangedPeriods(prev => ({ ...prev, [key]: false }));
      toast.success('Changes saved');
    }
  } catch (error) {
    console.error('Failed:', error)
    toast.error('Failed to save changes');
  }
}

// Add time conversion helper
const convertTo24Hour = (time: string, period: string) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  let hour = parseInt(hours)
  
  if (period === 'PM' && hour < 12) {
      hour += 12
  } else if (period === 'AM' && hour === 12) {
      hour = 0
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`
}

const convertTo12Hour = (time: string) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  let hour = parseInt(hours)
  
  // Convert hour to 12-hour format
  if (hour > 12) {
      hour = hour - 12
  } else if (hour === 0) {
      hour = 12
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`
}

const handleAddClass = async () => {
  try {
      // Format date properly for UTC storage to maintain compatibility
      const formattedDate = validTill ? 
        dayjs(validTill).startOf('day').utc().toISOString() : 
        null;

      const formattedClass = {
          subject: newClass.subject,
          startTime: convertTo12Hour(newClass.startTime),
          endTime: convertTo12Hour(newClass.endTime),
          validTill: formattedDate
      }

      console.log('Sending data:', formattedClass) // For debugging
      const response = await axios.post('/api/schedule/add-class', formattedClass)

      if (response.status === 200) {
          setShowAddClass(false)
          fetchTodaySchedule()
          toast.success('Class added successfully')
      }
  } catch (error) {
      console.error('Failed to add class:', error)
      toast.error('Failed to add class')
  }
}

  if (status === 'loading' || isLoading) {
    return (
      <AppTheme>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );
  }

  if (!session) return null;

  return (
    <AppTheme themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: (theme) => alpha(theme.palette.background.default, 1)  // Changed from 0.98 to 1
      }}>
        <Box sx={{ maxWidth: 'xl', mx: 'auto', p: 3 }}>
          {/* Header Section */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
            mb={3}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                {dayName}
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {dateDisplay} {monthName}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowAddClass(true)}
              >
                Add a Class
              </Button>
              <Link href="/exchange" >
                <Button
                  variant="contained"
                  startIcon={<SwapHoriz />}
                  
                >
                  Exchange Periods
                </Button>
              </Link>
            </Stack>
          </Stack>

          {/* Schedule Cards */}
          <Stack spacing={2}>
            {timetable?.periods.map((period, index) => (
              <Card
                key={`${period.subject}-${period.startTime}-${index}`}
                variant="outlined"
                sx={(theme) => ({
                  bgcolor: alpha(theme.palette.background.default, 1), // Changed from background.paper
                  borderRadius: 2,
                  p: 3,
                  transition: 'box-shadow 0.3s',
                  '&:hover': { boxShadow: 6 }
                })}
              >
                <Stack spacing={2}>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={2}
                  >
                    {/* Period Info */}
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {period.subject}
                        {period.temporaryExchange && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ ml: 1, p: 0.5, bgcolor: 'primary.light', borderRadius: 1 }}
                          >
                            Original: {period.temporaryExchange.originalSubject}
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {period.startTime} - {period.endTime} • {period.teacher}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Stack direction="row" spacing={2} alignItems="center">
                      <FormControlLabel
                        control={
                          <Box sx={{ position: 'relative' }}>
                            <Checkbox
                              checked={period.attended}
                              onChange={(e) => handleAttendanceChange(period.subject, e.target.checked, period.startTime)}
                              disabled={period.isHoliday || period.disabled || loadingStates.attendance[`${period.subject}-${period.startTime}`]}
                            />
                            {loadingStates.attendance[`${period.subject}-${period.startTime}`] && (
                              <CircularProgress
                                size={24}
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  marginTop: '-12px',
                                  marginLeft: '-12px',
                                }}
                              />
                            )}
                          </Box>
                        }
                        label="Present"
                      />
                      
                      <Box sx={{ position: 'relative' }}>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={period.attended || loadingStates.disable[`${period.subject}-${period.startTime}`]}
                          onClick={() => handleDisableClass(period.subject, !period.disabled, period.startTime)}
                          color={period.disabled ? "success" : "error"}
                        >
                          {period.disabled ? 'Enable' : 'Disable'}
                        </Button>
                        {loadingStates.disable[`${period.subject}-${period.startTime}`] && (
                          <CircularProgress
                            size={24}
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              marginTop: '-12px',
                              marginLeft: '-12px',
                            }}
                          />
                        )}
                      </Box>
                    </Stack>
                  </Stack>

                  {/* Topics Input */}
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      placeholder="Topics covered..."
                      value={period.topicsCovered || ''}
                      onChange={(e) => handleTopicsUpdate(period.subject, e.target.value, period.startTime)}
                      disabled={period.disabled || (!period.attended && !period.topicsCovered) || 
                        loadingStates.topics[`${period.subject}-${period.startTime}`]}
                      size="small"
                    />
                    {loadingStates.topics[`${period.subject}-${period.startTime}`] && (
                      <CircularProgress
                        size={20}
                        sx={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          marginTop: '-10px',
                        }}
                      />
                    )}
                  </Box>

                  {/* Save Changes Button */}
                  {changedPeriods[`${period.subject}-${period.startTime}`] && (
                    <Button
                      variant="contained"
                      onClick={() => handleSaveChanges(period.subject, period.startTime)}
                      fullWidth
                    >
                      Save Changes
                    </Button>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Holiday Confirmation Dialog */}
        <Dialog
          open={showHolidayConfirmation}
          onClose={() => setShowHolidayConfirmation(false)}
        >
          <DialogTitle>Enable Holiday Class?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This class is marked as a holiday. Enabling it might affect attendance records. Are you sure you want to proceed?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowHolidayConfirmation(false);
              setPendingEnableAction(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingEnableAction) {
                  updateClassStatus(pendingEnableAction.subject, false, pendingEnableAction.startTime);
                  setShowHolidayConfirmation(false);
                  setPendingEnableAction(null);
                }
              }}
              autoFocus
            >
              Enable Anyway
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Class Drawer */}
        <Drawer
          anchor="right"
          open={showAddClass}
          onClose={() => setShowAddClass(false)}
          PaperProps={{
            sx: {
              backgroundColor: theme => alpha(theme.palette.background.default, 1), // Added this line
              width: 400
            }
          }}
        >
          <Box sx={{ width: 400, p: 3 }}>
            <Typography variant="h6" gutterBottom>Add New Class</Typography>
            <Stack spacing={3}>
              <TextField
                label="Subject"
                value={newClass.subject}
                onChange={(e) => setNewClass(prev => ({
                  ...prev,
                  subject: e.target.value
                }))}
                fullWidth
              />
              
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack spacing={2}>
                  <TimePicker
                    label="Start Time"
                    value={dayjs(`2000/01/01 ${newClass.startTime}`)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setNewClass(prev => ({
                          ...prev,
                          startTime: newValue.format('HH:mm')
                        }))
                      }
                    }}
                  />
                  <TimePicker
                    label="End Time"
                    value={dayjs(`2000/01/01 ${newClass.endTime}`)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setNewClass(prev => ({
                          ...prev,
                          endTime: newValue.format('HH:mm')
                        }))
                      }
                    }}
                  />
                  <Typography variant="subtitle1" gutterBottom>Valid Till</Typography>
                  <DateCalendar
                    value={validTill ? dayjs(validTill) : null}
                    onChange={(newValue) => setValidTill(newValue ? newValue.toDate() : undefined)}
                    disablePast
                  />
                </Stack>
              </LocalizationProvider>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={() => setShowAddClass(false)}>
                  Cancel
                </Button>
                {(newClass.subject &&newClass.startTime &&newClass.endTime || validTill) && (
                  <Button
                  variant="contained"
                  onClick={handleAddClass}
                >
                  Add Class
                </Button>
                )}
                
              </Stack>
            </Stack>
          </Box>
        </Drawer>
      </Box>
    </AppTheme>
  );
}
