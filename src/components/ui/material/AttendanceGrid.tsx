import { Box , CircularProgress, TextField} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Button } from '@mui/material';
import { columns, getGridRows } from './data/gridData';
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppTheme from '@/components/shared-theme/AppTheme'



export default function AttendanceGrid() {
  
  const { status } = useSession();
  const {
    subjects,
    loading,
    fromDate,
    tillDate,
    setFromDate,
    setTillDate,
    handleDateFilter,
    resetFilter,
    fetchAttendance,
    targetPercentage, 
    setTargetPercentage,
  } = useAttendanceData();



  const handleTargetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setTargetPercentage(value);
    }
  };


  useEffect(() => {
    if (status === 'authenticated') {
      fetchAttendance();
    }
  }, [status, fetchAttendance]);

  if (loading) return (
      <AppTheme>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );

  


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <DatePicker
            label="From Date"
            value={fromDate}
            onChange={setFromDate}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label="Till Date"
            value={tillDate}
            onChange={setTillDate}
            slotProps={{ textField: { size: 'small' } }}
          />
          <Button 
            variant="contained" 
            onClick={handleDateFilter}
            size="small"
          >
            Filter
          </Button>
          <Button 
            variant="outlined" 
            onClick={resetFilter}
            size="small"
          >
            Reset
          </Button>

          <TextField
        type="number"
        label="Target Percentage"
        value={targetPercentage}
        onChange={handleTargetChange}
        inputProps={{ min: 0, max: 100 }}
        sx={{ mb: 2, width: 200 }}
          />

        </Box>
    
    <DataGrid
      autoHeight
      checkboxSelection
      rows={getGridRows(subjects, targetPercentage)}
      columns={columns}
      getRowClassName={(params) =>
        params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
      }
      initialState={{
        pagination: { paginationModel: { pageSize: 20 } },
      }}
      pageSizeOptions={[10, 20, 50]}
      disableColumnResize
      density="compact"
      slotProps={{
        filterPanel: {
          filterFormProps: {
            logicOperatorInputProps: {
              variant: 'outlined',
              size: 'small',
            },
            columnInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            operatorInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            valueInputProps: {
              InputComponentProps: {
                variant: 'outlined',
                size: 'small',
              },
            },
          },
        },
      }}
    />
    </Box>
    </LocalizationProvider>
  );
}
