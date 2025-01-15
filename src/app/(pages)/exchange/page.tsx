"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import axios from "axios";
import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Stack,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import ClearIcon from "@mui/icons-material/Clear";
import AppTheme from "@/components/shared-theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";
import { alpha } from "@mui/material/styles";
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
} from "@/components/shared-theme/customizations";
const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
};

interface Period {
  subject: string;
  startTime: string;
  endTime: string;
  endDate?: string; // Add this
}

interface DaySchedule {
  day: string;
  periods: Period[];
}

interface Timetable {
  schedule: DaySchedule[];
}

export default function ExchangePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [firstPeriod, setFirstPeriod] = useState({
    day: "",
    startTime: "",
    endTime: "",
  });
  const [secondPeriod, setSecondPeriod] = useState({
    day: "",
    startTime: "",
    endTime: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await fetch("/api/user/timetable");
        if (response.ok) {
          const data = await response.json();
          setTimetable(data);
        }
      } catch (error) {
        console.error("Failed to fetch timetable:", error);
      }
    };

    if (session) {
      fetchTimetable();
    }
  }, [session]);

  const handleExchange = async () => {
    if (!firstPeriod.day || !secondPeriod.day) {
      setError("Please select both periods");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/exchange-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstPeriod,
          secondPeriod,
          endDate: endDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to exchange periods");
      }

      await axios.post("/api/start", { action: "startDay" });

      router.refresh();
      setError("");
      toast.success("Periods exchanged successfully!");

      // Reset selections after successful exchange
      setFirstPeriod({ day: "", startTime: "", endTime: "" });
      setSecondPeriod({ day: "", startTime: "", endTime: "" });
      setEndDate("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      toast.error("Failed to exchange periods");
    } finally {
      setLoading(false);
    }
  };

  if (!timetable)
    return (
      <AppTheme>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "80vh",
          }}
        >
          <CircularProgress />
        </Box>
      </AppTheme>
    );

  return (
    <AppTheme themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />

      <Box
        component="main"
                  sx={(theme) => ({
                    flexGrow: 1,
                    backgroundColor: alpha(theme.palette.background.default, 1),
                    overflow: 'auto',
                  })}
      >
        <Container
          maxWidth="md"
          sx={{
            width: "100%",
            mx: "auto",
          }}
        >
          <Box
            sx={(theme) =>({
              backgroundColor: alpha(theme.palette.background.default, 1),
              overflow: "auto",
              borderRadius: 2,
            })}
          >
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                   Exchange Periods
            </Typography>

            <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
              {" "}
              {/* Responsive spacing */}
              {/* First Period Selection */}
              <Box
                sx={(theme) =>({
                  backgroundColor: alpha(theme.palette.background.default, 1),
                  borderRadius: 2,
                  p: { xs: 2, sm: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    overflow: "auto",
                    transform: "translateY(-2px)",
                    boxShadow: (theme) => theme.shadows[4],
                  },
                })}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }} // Responsive font size
                >
                  First Period
                </Typography>
                <Stack spacing={{ xs: 1, sm: 2 }}>
                  {" "}
                  {/* Responsive spacing */}
                  <FormControl fullWidth>
                    <InputLabel>Select Day</InputLabel>
                    <Select
                      value={firstPeriod.day}
                      onChange={(e) =>
                        setFirstPeriod({ ...firstPeriod, day: e.target.value })
                      }
                      label="Select Day"
                    >
                      <MenuItem value="">None</MenuItem>
                      {timetable.schedule.map((day) => (
                        <MenuItem key={day.day} value={day.day}>
                          {day.day}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {firstPeriod.day && (
                    <FormControl fullWidth>
                      <InputLabel>Select Period</InputLabel>
                      <Select
                        value={`${firstPeriod.startTime}-${firstPeriod.endTime}`}
                        onChange={(e) => {
                          const [startTime, endTime] =
                            e.target.value.split("-");
                          setFirstPeriod({
                            ...firstPeriod,
                            startTime,
                            endTime,
                          });
                        }}
                        label="Select Period"
                      >
                        <MenuItem value="">None</MenuItem>
                        {timetable.schedule
                          .find((d) => d.day === firstPeriod.day)
                          ?.periods.map((period, i) => (
                            <MenuItem
                              key={i}
                              value={`${period.startTime}-${period.endTime}`}
                            >
                              {period.subject} ({period.startTime} -{" "}
                              {period.endTime})
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  )}
                </Stack>
              </Box>
              {/* Second Period Selection */}
              <Box
                sx={(theme) =>({
                  backgroundColor: alpha(theme.palette.background.default, 1),
                  borderRadius: 2,
                  p: { xs: 2, sm: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    overflow: "auto",
                    transform: "translateY(-2px)",
                    boxShadow: (theme) => theme.shadows[4],
                  },
                })}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  Second Period
                </Typography>
                <Stack spacing={{ xs: 1, sm: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Select Day</InputLabel>
                    <Select
                      value={secondPeriod.day}
                      onChange={(e) =>
                        setSecondPeriod({
                          ...secondPeriod,
                          day: e.target.value,
                        })
                      }
                      label="Select Day"
                    >
                      <MenuItem value="">None</MenuItem>
                      {timetable.schedule.map((day) => (
                        <MenuItem key={day.day} value={day.day}>
                          {day.day}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {secondPeriod.day && (
                    <FormControl fullWidth>
                      <InputLabel>Select Period</InputLabel>
                      <Select
                        value={`${secondPeriod.startTime}-${secondPeriod.endTime}`}
                        onChange={(e) => {
                          const [startTime, endTime] =
                            e.target.value.split("-");
                          setSecondPeriod({
                            ...secondPeriod,
                            startTime,
                            endTime,
                          });
                        }}
                        label="Select Period"
                      >
                        <MenuItem value="">None</MenuItem>
                        {timetable.schedule
                          .find((d) => d.day === secondPeriod.day)
                          ?.periods.map((period, i) => (
                            <MenuItem
                              key={i}
                              value={`${period.startTime}-${period.endTime}`}
                            >
                              {period.subject} ({period.startTime} -{" "}
                              {period.endTime})
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  )}
                </Stack>
              </Box>
              {/* Exchange Duration */}
              <Box
                sx={(theme) =>({
                  backgroundColor: alpha(theme.palette.background.default, 1),
                  borderRadius: 2,
                  p: { xs: 2, sm: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    
                    overflow: "auto",
                    transform: "translateY(-2px)",
                    boxShadow: (theme) => theme.shadows[4],
                  },
                })}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  Exchange Duration
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" }, // Stack on mobile, row on larger screens
                    alignItems: { xs: "stretch", sm: "center" },
                    gap: { xs: 1, sm: 2 },
                  }}
                >
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="End Date"
                      value={endDate ? dayjs(endDate) : null}
                      onChange={(newValue) =>
                        setEndDate(
                          newValue ? newValue.format("YYYY-MM-DD") : ""
                        )
                      }
                      minDate={dayjs()}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "medium",
                        },
                      }}
                    />
                  </LocalizationProvider>
                  <IconButton
                    onClick={() => setEndDate("")}
                    disabled={!endDate}
                    sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
                  >
                    <ClearIcon />
                  </IconButton>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" }, // Responsive font size
                  }}
                >
                  Leave empty for permanent exchange
                </Typography>
              </Box>
              {error && (
                <Typography
                  color="error"
                  align="center"
                  sx={{
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                    backgroundColor: (theme) =>
                      alpha(theme.palette.error.main, 0.1),
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  {error}
                </Typography>
              )}

              {(firstPeriod.day && secondPeriod.day) && (<Button
                variant="contained"
                size="large"
                onClick={handleExchange}
                disabled={loading}
                sx={{
                  py: { xs: 1.5, sm: 2 },
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  "&:not(:disabled):hover": {
                    transform: "translateY(-2px)",
                    boxShadow: (theme) => theme.shadows[8],
                  },
                }}
              >
                {loading ? (
                  <CircularProgress
                    size={24}
                    color="inherit"
                    sx={{ my: { xs: 0.5, sm: 0 } }}
                  />
                ) : (
                  "Exchange Periods"
                )}
              </Button>)}

              
              
            </Stack>
          </Box>
        </Container>
      </Box>
    </AppTheme>
  );
}
