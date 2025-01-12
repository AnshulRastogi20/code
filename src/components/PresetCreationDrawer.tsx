"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import axios from 'axios'
import { Period } from "@/types"
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Stack,
  useTheme,
  Divider,
  Drawer,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'

type DaySchedule = {
  day: string
  periods: Period[]
}

interface PresetCreationDrawerProps {
  onPresetCreated?: () => void;
}

export function PresetCreationDrawer({ onPresetCreated }: PresetCreationDrawerProps) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: "MONDAY", periods: [] },
    { day: "TUESDAY", periods: [] },
    { day: "WEDNESDAY", periods: [] },
    { day: "THURSDAY", periods: [] },
    { day: "FRIDAY", periods: [] },
    { day: "SATURDAY", periods: [] },
    { day: "SUNDAY", periods: [] }
  ])

  const addPeriod = (dayIndex: number) => {
    const newSchedule = [...schedule]
    newSchedule[dayIndex].periods.push({
      subject: "",
      startTime: "",
      endTime: "",
      teacher: "",
      date: new Date(),
      temporaryExchange: null
    })
    setSchedule(newSchedule)
  }

  const removePeriod = (dayIndex: number, periodIndex: number) => {
    const newSchedule = [...schedule]
    newSchedule[dayIndex].periods.splice(periodIndex, 1)
    setSchedule(newSchedule)
  }

  const formatTimeForBackend = (date: dayjs.Dayjs | null) => {
    if (!date) return "";
    return date.format("HH:mm");
  }

  const parseTimeString = (timeString: string) => {
    if (!timeString) return null;
    return dayjs(timeString, "HH:mm");
  }

  const updatePeriod = (
    dayIndex: number,
    periodIndex: number,
    field: keyof Period,
    value: string | dayjs.Dayjs | null
  ) => {
    const newSchedule = [...schedule];
    if (field === "startTime" || field === "endTime") {
      newSchedule[dayIndex].periods[periodIndex] = {
        ...newSchedule[dayIndex].periods[periodIndex],
        [field]: dayjs.isDayjs(value) ? formatTimeForBackend(value) : value
      };
    } else {
      newSchedule[dayIndex].periods[periodIndex] = {
        ...newSchedule[dayIndex].periods[periodIndex],
        [field]: value as string
      };
    }
    setSchedule(newSchedule);
  };

  const handleSubmit = async () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name")
      return
    }

    setIsLoading(true)
    try {
      await axios.post('/api/presets', {
        name: presetName,
        schedule: schedule,
        isDefault: false,
        createdBy: "user",
      });

      toast.success("Preset created successfully!")
      setPresetName("")
      setSchedule([
        { day: "MONDAY", periods: [] },
        { day: "TUESDAY", periods: [] },
        { day: "WEDNESDAY", periods: [] },
        { day: "THURSDAY", periods: [] },
        { day: "FRIDAY", periods: [] },
        { day: "SATURDAY", periods: [] },
        { day: "SUNDAY", periods: [] }
      ])
      setOpen(false);
      onPresetCreated?.(); // Call the callback after successful creation
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to create preset")
        console.error('Axios error:', error.response?.data)
      } else {
        toast.error("An unexpected error occurred")
        console.error('Unexpected error:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Custom styles
  const boxStyle = {
    backgroundColor: alpha(theme.palette.background.default, 0.9),
    borderRadius: theme.shape.borderRadius,
    p: 2,
    mb: 2
  }

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: alpha(theme.palette.background.paper, 0.8),
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
    },
    mb: 2
  }

  return (
    <>
      <Button
        fullWidth
        variant="contained"
        onClick={() => setOpen(true)}
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText
        }}
      >
        Create New Timetable
      </Button>

      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        SlideProps={{
          style: { position: 'absolute' }
        }}
      >
        <Box
          sx={{
            maxHeight: '90vh',
            backgroundColor: alpha(theme.palette.background.default, 0.95),
            backdropFilter: 'blur(10px)',
            width: '100%',
            position: 'relative'
          }}
        >
          <Box sx={{ 
            maxWidth: '4xl',
            mx: 'auto',
            p: 4,
            width: '100%'
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <div>
                <Typography variant="h5" color="textPrimary" gutterBottom>
                  Create New Timetable Preset
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Fill in the details for your new timetable preset.
                </Typography>
              </div>
              <Button onClick={() => setOpen(false)}>
                Close
              </Button>
            </Stack>

            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Preset Name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                sx={inputStyle}
              />
              
              <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                {schedule.map((day, dayIndex) => (
                  <Box key={day.day} sx={boxStyle}>
                    <Typography variant="h6" gutterBottom>
                      {day.day}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {day.periods.map((period, periodIndex) => (
                      <Stack 
                        key={periodIndex}
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{ mb: 2 }}
                      >
                        <TextField
                          label="Subject"
                          value={period.subject}
                          onChange={(e) => updatePeriod(dayIndex, periodIndex, "subject", e.target.value)}
                          sx={inputStyle}
                          fullWidth
                        />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <TimePicker
                            label="Start Time"
                            value={parseTimeString(period.startTime)}
                            onChange={(newValue) => updatePeriod(dayIndex, periodIndex, "startTime", newValue)}
                            sx={inputStyle}
                            views={['hours', 'minutes']}
                            format="HH:mm"
                          />
                          <TimePicker
                            label="End Time"
                            value={parseTimeString(period.endTime)}
                            onChange={(newValue) => updatePeriod(dayIndex, periodIndex, "endTime", newValue)}
                            sx={inputStyle}
                            views={['hours', 'minutes']}
                            format="HH:mm"
                          />
                        </LocalizationProvider>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            label="Teacher"
                            value={period.teacher}
                            onChange={(e) => updatePeriod(dayIndex, periodIndex, "teacher", e.target.value)}
                            sx={inputStyle}
                            fullWidth
                          />
                          <IconButton 
                            onClick={() => removePeriod(dayIndex, periodIndex)}
                            color="error"
                            sx={{ mt: -2 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </Stack>
                    ))}
                    
                    <Box component={Button}
                      onClick={() => addPeriod(dayIndex)}
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        gap: 1,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <AddIcon />
                      Add Period
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
              <Button
                variant="outlined"
                onClick={() => setOpen(false)}
                sx={{ color: theme.palette.text.primary }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await handleSubmit();
                  setOpen(false);
                }}
                disabled={isLoading}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText
                }}
              >
                {isLoading ? "Saving..." : "Save Preset"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}