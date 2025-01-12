'use client'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import dayjs from 'dayjs'
import { Box, Container, Typography, Button, Dialog, DialogTitle, DialogContent, 
         DialogActions, IconButton, Switch, Chip, Stack, 
         DialogContentText, useTheme, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Grid, 
         Card} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AppTheme from '@/components/shared-theme/AppTheme'
import { CalendarData } from '@/types'
import CssBaseline from '@mui/material/CssBaseline'
import type {} from '@mui/x-date-pickers/themeAugmentation';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '@/components/shared-theme/customizations';
import { toast } from 'react-hot-toast'
import CircularProgress from '@mui/material/CircularProgress'
import PageViewsBarChart from '@/components/ui/material/PageViewsBarChart'

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState<Date>()
    const [calendarData, setCalendarData] = useState<CalendarData[]>([])
    const [selectedClass, setSelectedClass] = useState<CalendarData | null>(null)
    const [showTopics, setShowTopics] = useState(false)
    const [showHolidayConfirm, setShowHolidayConfirm] = useState(false)
    const [showAttendanceConfirm, setShowAttendanceConfirm] = useState(false)
    const [selectedAttendance, setSelectedAttendance] = useState<{
        subject: string;
        date: string;
        startTime: string;
        current: boolean;
    } | null>(null)
    const [selectedHappened, setSelectedHappened] = useState<{
        subject: string;
        date: string;
        startTime: string;
        current: boolean;
    } | null>(null)
    const [showHappenedConfirm, setShowHappenedConfirm] = useState(false)
    const [loadingStates, setLoadingStates] = useState<{
        [key: string]: boolean
    }>({});

    useEffect(() => {
        fetchCalendarData();
    }, []); // Empty dependency array since fetchCalendarData is defined inside component

    const fetchCalendarData = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/calendar');
            setCalendarData(data.calendarData);
        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
        }
    }, []); // Empty dependency array since this function doesn't depend on any props or state

    const markHoliday = async (date: Date) => {
        try {
            const response = await axios.post('/api/calendar', { date })
            if (response.status === 200) {
                await fetchCalendarData()
            }
        } catch (error) {
            console.error('Failed to mark holiday:', error)
        }
    }

    const getClassesForDate = (date: Date | dayjs.Dayjs) => {
        const dateString = dayjs(date).format('YYYY-MM-DD');
        return calendarData.filter(cls => 
            dayjs(cls.date).format('YYYY-MM-DD') === dateString
        );
    };

    const isHolidayDate = (date: Date | dayjs.Dayjs) => {
        const classes = getClassesForDate(date);
        return classes.length > 0 && classes.every(cls => cls.isHoliday);
    };

    const handleHolidayClick = () => {
        setShowHolidayConfirm(true)
    }

    const confirmMarkHoliday = async () => {
        await markHoliday(selectedDate!)
        setShowHolidayConfirm(false)
    }

    const getLoadingKey = (subject: string, date: string, startTime: string, type: 'happened' | 'attended') => 
        `${subject}-${date}-${startTime}-${type}`;

    const handleAttendanceChange = async (confirmed: boolean) => {
        if (!confirmed || !selectedAttendance) {
            setShowAttendanceConfirm(false);
            return;
        }

        const loadingKey = getLoadingKey(
            selectedAttendance.subject, 
            selectedAttendance.date, 
            selectedAttendance.startTime, 
            'attended'
        );
        
        try {
            setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
            
            const response = await axios.patch('/api/calendar/attended', {
                subject: selectedAttendance.subject,
                date: selectedAttendance.date,
                startTime: selectedAttendance.startTime,
                attended: !selectedAttendance.current
            });

            if (response.status === 200 && response.data.success) {
                setCalendarData(prevData => 
                    prevData.map(cls => 
                        cls.subject === selectedAttendance.subject &&
                        cls.date === selectedAttendance.date &&
                        cls.startTime === selectedAttendance.startTime
                            ? { ...cls, attended: !selectedAttendance.current }
                            : cls
                    )
                );
                toast.success(`Attendance ${!selectedAttendance.current ? 'marked' : 'unmarked'}`);
            }
        } catch (error) {
            console.error('Failed to update attendance:', error);
            toast.error('Failed to update attendance');
            setCalendarData(prev => [...prev]);
        } finally {
            setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
            setShowAttendanceConfirm(false);
        }
    };

    const handleHappenedChange = async (confirmed: boolean) => {
        if (!confirmed || !selectedHappened) {
            setShowHappenedConfirm(false);
            return;
        }

        const loadingKey = getLoadingKey(
            selectedHappened.subject, 
            selectedHappened.date, 
            selectedHappened.startTime, 
            'happened'
        );
        
        try {
            setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));
            
            const response = await axios.patch('/api/calendar/happened', {
                subject: selectedHappened.subject,
                date: selectedHappened.date,
                startTime: selectedHappened.startTime,
                happened: !selectedHappened.current
            });

            if (response.status === 200 && response.data.success) {
                setCalendarData((prevData) => 
                    prevData.map(cls => 
                        cls.subject === selectedHappened.subject &&
                        cls.date === selectedHappened.date &&
                        cls.startTime === selectedHappened.startTime
                            ? { ...cls, happened: !selectedHappened.current, attended: !selectedHappened.current ? false : cls.attended }
                            : cls
                    )
                );
                toast.success(`Class ${!selectedHappened.current ? 'marked as happened' : 'marked as not happened'}`);
            }
        } catch (error) {
            console.error('Failed to update happened status:', error);
            toast.error('Failed to update class status');
            setCalendarData(prev => [...prev]);
        } finally {
            setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
            setShowHappenedConfirm(false);
            setSelectedHappened(null); // Reset selected state
        }
    };

    const handleAddSchedule = async () => {
        if (!selectedDate) return;
        
        try {
            const response = await axios.post('/api/calendar/add-schedule', { 
                date: selectedDate 
            });
            
            if (response.status === 200) {
                await fetchCalendarData()
            }
        } catch (error) {
            console.error('Failed to add schedule:', error)
        }
    }

    const theme = useTheme();

    const getDateStyles = (date: dayjs.Dayjs) => {
        const isHoliday = calendarData.some(cls => 
            dayjs(cls.date).format('YYYY-MM-DD') === date.format('YYYY-MM-DD') && cls.isHoliday
        );
        const hasData = calendarData.some(cls => 
            dayjs(cls.date).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
        );
        const isToday = date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

        return {
            ...(isHoliday && { 
                color: theme.palette.error.main,
                fontWeight: 'bold',
                bgcolor: alpha(theme.palette.error.main, 0.1)
            }),
            ...(isToday && { 
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                bgcolor: alpha(theme.palette.primary.main, 0.1)
            }),
            ...(!hasData && { color: alpha(theme.palette.text.disabled, 0.5) })
        };
    };

    // Convert Date to dayjs for the calendar
    const handleDateChange = (newDate: dayjs.Dayjs | null) => {
        setSelectedDate(newDate ? newDate.toDate() : undefined);
    };

    return (
        <AppTheme themeComponents={xThemeComponents}>
            <CssBaseline enableColorScheme />
            <Box sx={(theme) => ({
                minHeight: '100vh',
                backgroundColor: alpha(theme.palette.background.default, 1),
                color: 'text.primary'
            })}>
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    {/* Top Section with Calendar and Chart */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        {/* Calendar Grid */}
                        <Grid item xs={12} md={7}>
                            <Card
                                variant= 'outlined'
                                sx={{
                                    p: 4,
                                    height: '100%',
                                    borderRadius: 2,

                                }}
                            >
                                <Stack spacing={2}>
                                    {/* Calendar Component */}
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DateCalendar
                                            value={selectedDate ? dayjs(selectedDate) : null}
                                            onChange={handleDateChange}
                                            slots={{
                                                day: (props: any) => {
                                                    const customStyles = getDateStyles(dayjs(props.day));
                                                    return (
                                                        <Box
                                                            component="button"
                                                            onClick={() => props.onDaySelect?.(props.day)}
                                                            sx={{
                                                                ...customStyles,
                                                                p: { xs: 1.5, md: 2.5 },
                                                                borderRadius: 1,
                                                                cursor: 'pointer',
                                                                border: 'none',
                                                                background: 'none',
                                                                width: '40px',
                                                                height: '40px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: { xs: '0.875rem', md: '1rem' },
                                                                '&:hover': {
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                                                                }
                                                            }}
                                                        >
                                                            {dayjs(props.day).date()}
                                                        </Box>
                                                    );
                                                }
                                            }}
                                            sx={{
                                                width: '100%',
                                                maxWidth: '800px',
                                                color: 'text.primary',
                                                '& .MuiPickersDay-root': {
                                                    color: 'text.primary',
                                                    fontSize: { xs: '0.875rem', md: '1rem' }
                                                },
                                                '& .MuiDayCalendar-weekDayLabel': {
                                                    color: theme.palette.primary.main,
                                                    fontSize: { xs: '0.875rem', md: '1rem' },
                                                    width: '40px',
                                                    height: '40px',
                                                    margin: '2px',
                                                    justifyContent: 'center'
                                                },
                                                '& .MuiPickersCalendarHeader-label': {
                                                    color: theme.palette.text.primary,
                                                    fontSize: { xs: '1rem', md: '1.25rem' }
                                                },
                                                '& .MuiPickersArrowSwitcher-button': {
                                                    color: theme.palette.text.primary
                                                }
                                            }}
                                        />
                                    </LocalizationProvider>

                                    {/* Legend and Buttons */}
                                    <Stack 
                                        direction={{ xs: 'column', sm: 'row' }} 
                                        spacing={2} 
                                        alignItems="center"
                                        justifyContent="space-between"
                                    >
                                        {selectedDate && !isHolidayDate(selectedDate) && (
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => new Date(selectedDate) > new Date() 
                                                    ? handleHolidayClick()
                                                    : null}
                                            >
                                                {new Date(selectedDate) > new Date() ? 'Mark Holiday' : 'Selected Date Schedule'}
                                            </Button>
                                        )}

                                        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                                            <Chip sx={{p:1.5}} label="Today" color="primary" variant="outlined" />
                                            <Chip sx={{p:1.5}} label="Holiday" color="error" variant="outlined" />
                                            <Chip sx={{p:1.5}} label="Class Days" color="default" variant="outlined" />
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </Card>
                        </Grid>

                        {/* Chart Grid */}
                        <Grid item xs={12} md={5}>
                        <Card
                                variant= 'outlined'
                                sx={{
                                    p: 4,
                                    height: '100%',
                                    borderRadius: 2,

                                }}
                            >
                                <PageViewsBarChart />
                        </Card>
                        </Grid>
                    </Grid>

                    {/* Schedule Section */}
                    <Grid container>
                        <Grid item xs={12}>
                            {selectedDate && !isHolidayDate(selectedDate) && (
                                <Card 
                                variant= 'outlined'
                                sx={{ 
                                    p: 3,
                                    
                                }}>
                                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                                        Schedule for {dayjs(selectedDate).format('MMMM D, YYYY')}
                                    </Typography>
                                    
                                    {getClassesForDate(selectedDate).length > 0 ? (
                                        <TableContainer>
                                            <Table sx={{
                                                '& .MuiTableCell-root': {
                                                    color: 'text.primary',
                                                    borderColor: alpha(theme.palette.divider, 0.1)
                                                },
                                                '& .MuiTableRow-root:hover': {
                                                    backgroundColor: alpha(theme.palette.background.default, 0.1)
                                                }
                                            }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Subject</TableCell>
                                                        <TableCell>Time</TableCell>
                                                        <TableCell align="center">Status</TableCell>
                                                        <TableCell align="center">Attendance</TableCell>
                                                        <TableCell align="center">Topics</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {getClassesForDate(selectedDate).map((cls, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>
                                                                <Stack>
                                                                    <Typography>{cls.subject}</Typography>
                                                                    {cls.temporaryExchange && (
                                                                        <Chip
                                                                            size="small"
                                                                            label={`Original: ${cls.temporaryExchange.originalSubject}`}
                                                                            color="info"
                                                                            variant="outlined"
                                                                            sx={{ m:1 , p:1  }}
                                                                        />
                                                                    )}
                                                                </Stack>
                                                            </TableCell>
                                                            <TableCell>{cls.startTime} - {cls.endTime}</TableCell>
                                                            <TableCell align="center">
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                                    {loadingStates[getLoadingKey(cls.subject, cls.date, cls.startTime, 'happened')] ? (
                                                                        <CircularProgress size={20} />
                                                                    ) : (
                                                                        <>
                                                                            <Switch
                                                                                checked={cls.happened}
                                                                                onChange={() => {
                                                                                    setSelectedHappened({
                                                                                        subject: cls.subject,
                                                                                        date: cls.date,
                                                                                        startTime: cls.startTime,
                                                                                        current: cls.happened
                                                                                    });
                                                                                    setShowHappenedConfirm(true);
                                                                                }}
                                                                                sx={{
                                                                                    '& .MuiSwitch-track': {
                                                                                        backgroundColor: theme.palette.text.secondary,
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Chip
                                                                                size="small"
                                                                                label={cls.happened ? "Happened" : "Not Happened"}
                                                                                color={cls.happened ? "success" : "default"}
                                                                                onClick={() => {
                                                                                    setSelectedHappened({
                                                                                        subject: cls.subject,
                                                                                        date: cls.date,
                                                                                        startTime: cls.startTime,
                                                                                        current: cls.happened
                                                                                    });
                                                                                    setShowHappenedConfirm(true);
                                                                                }}
                                                                                sx={{ cursor: 'pointer' }}
                                                                            />
                                                                        </>
                                                                    )}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                                    {loadingStates[getLoadingKey(cls.subject, cls.date, cls.startTime, 'attended')] ? (
                                                                        <CircularProgress size={20} />
                                                                    ) : (
                                                                        <>
                                                                            <Switch
                                                                                checked={cls.attended}
                                                                                disabled={!cls.happened}
                                                                                onChange={() => {
                                                                                    setSelectedAttendance({
                                                                                        subject: cls.subject,
                                                                                        date: cls.date,
                                                                                        startTime: cls.startTime,
                                                                                        current: cls.attended
                                                                                    });
                                                                                    setShowAttendanceConfirm(true);
                                                                                }}
                                                                                sx={{
                                                                                    '& .MuiSwitch-track': {
                                                                                        backgroundColor: theme.palette.text.secondary,
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Chip
                                                                                size="small"
                                                                                label={cls.attended ? "Attended" : "Absent"}
                                                                                color={cls.attended ? "success" : "error"}
                                                                                onClick={() => {
                                                                                    if (cls.happened) {
                                                                                        setSelectedAttendance({
                                                                                            subject: cls.subject,
                                                                                            date: cls.date,
                                                                                            startTime: cls.startTime,
                                                                                            current: cls.attended
                                                                                        });
                                                                                        setShowAttendanceConfirm(true);
                                                                                    }
                                                                                }}
                                                                                sx={{ 
                                                                                    cursor: cls.happened ? 'pointer' : 'not-allowed',
                                                                                    opacity: cls.happened ? 1 : 0.7,
                                                                                    '&:hover': cls.happened ? {
                                                                                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                                                                                    } : {}
                                                                                }}
                                                                            />
                                                                        </>
                                                                    )}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                
                                                                {
                                                                    (cls.happened && cls.attended ) && (
                                                                        <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    onClick={() => {
                                                                        setSelectedClass(cls);
                                                                        setShowTopics(true);
                                                                    }}
                                                                    sx={{
                                                                        bgcolor: alpha(theme.palette.primary.main, 0.8),
                                                                        
                                                                        '&.Mui-disabled': {
                                                                            bgcolor: alpha(theme.palette.primary.main, 0.3)
                                                                        }
                                                                    }}
                                                                >
                                                                    View Topics
                                                                </Button>
                                                                    )
                                                                }

                                                                {
                                                                    (!cls.happened || !cls.attended ) && (
                                                                        <Chip
                                                                        size="small"
                                                                        label='NA'
                                                                        color= 'default'
                                                                        sx={{ cursor: 'pointer' }}
                                                                    />
                                                                    )
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            gap: 2,
                                            mt: 2 
                                        }}>
                                            <Typography>No Schedule for this date</Typography>
                                            {selectedDate && new Date(selectedDate) < new Date() && (
                                                <Button 
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={handleAddSchedule}
                                                >
                                                    Add Schedule
                                                </Button>
                                            )}
                                        </Box>
                                    )}
                                </Card>
                            )}

                            {selectedDate && isHolidayDate(selectedDate) && (
                                <Card 
                                variant= 'outlined'
                                sx={{ 
                                    p: 3,
                                    
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                                }}>
                                    <Typography variant="h6" align="center">
                                        Holiday on {dayjs(selectedDate).format('MMMM D, YYYY')}
                                    </Typography>
                                </Card>
                            )}
                        </Grid>
                    </Grid>

                    {/* ...existing dialogs... */}
                    <Dialog open={showHolidayConfirm} onClose={() => setShowHolidayConfirm(false)}>
                        <DialogTitle>Mark Holiday?</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                This action is irreversible. All classes scheduled for {selectedDate?.toDateString()} will be cancelled.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowHolidayConfirm(false)}>Cancel</Button>
                            <Button onClick={confirmMarkHoliday} color="primary" variant="contained">
                                Confirm
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog open={showAttendanceConfirm} onClose={() => setShowAttendanceConfirm(false)}>
                        <DialogTitle>Change Attendance Status?</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Are you sure you want to change the attendance status for this class?
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowAttendanceConfirm(false)}>Cancel</Button>
                            <Button onClick={() => handleAttendanceChange(true)} color="primary" variant="contained">
                                Confirm
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog open={showHappenedConfirm} onClose={() => setShowHappenedConfirm(false)}>
                        <DialogTitle>Change Class Status?</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Are you sure you want to change the status of this class?
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowHappenedConfirm(false)}>Cancel</Button>
                            <Button onClick={() => handleHappenedChange(true)} color="primary" variant="contained">
                                Confirm
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog 
                        open={showTopics} 
                        onClose={() => setShowTopics(false)}
                        PaperProps={{
                            sx: {
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                boxShadow: 24,
                                p: 2,
                                minWidth: { xs: '90%', sm: '400px' }
                            }
                        }}
                    >
                        <DialogTitle sx={{ color: 'text.primary' }}>
                            Topics Covered - {selectedClass?.subject}
                        </DialogTitle>
                        <DialogContent>
                            <Stack spacing={1}>
                                {selectedClass?.topicsCovered && selectedClass.topicsCovered.length > 0 ? (
                                    selectedClass.topicsCovered.map((topic, idx) => (
                                        <Typography 
                                            key={idx} 
                                            sx={{ 
                                                color: 'text.primary',
                                                p: 1,
                                                borderRadius: 1,
                                                backgroundColor: alpha(theme.palette.background.default, 0.6)
                                            }}
                                        >
                                            {topic}
                                        </Typography>
                                    ))
                                ) : (
                                    <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                        No topics covered
                                    </Typography>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button 
                                onClick={() => setShowTopics(false)}
                                variant="contained"
                                color="primary"
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Container>
            </Box>
        </AppTheme>
    );
}
