import { SubjectAttendance } from '@/types';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import { GridCellParams, GridColDef } from '@mui/x-data-grid';




function renderStatus(status: 'Enough' | 'Low') {
  const colors: { [index: string]: 'success' | 'default' } = {
    Enough: 'success',
    Low: 'default',
  };

  return <Chip label={status} color={colors[status]} size="small" />;
}

export function renderAvatar(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: GridCellParams<{ name: string; color: string }, any, any>,
) {
  if (params.value == null) {
    return '';
  }

  return (
    <Avatar
      sx={{
        backgroundColor: params.value.color,
        width: '24px',
        height: '24px',
        fontSize: '0.85rem',
      }}
    >
      {params.value.name.toUpperCase().substring(0, 1)}
    </Avatar>
  );
}

export const columns: GridColDef[] = [
  { 
    field: 'subject', 
    headerName: 'Subject', 
    flex: 1.5, 
    minWidth: 200 },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.5,
    minWidth: 80,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    renderCell: (params) => renderStatus(params.value as any),
  },
  {
    field: 'happened',
    headerName: 'Happened Classes',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 80,
  },
  {
    field: 'attended',
    headerName: 'Attended Classes',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'percentage',
    headerName: 'Percentage',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 120,
  },
  {
    field: 'requirments',
    headerName: 'Required Classes',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 100,
  },

];

export const getGridRows = (subjects: SubjectAttendance[], targetPercentage: number = 75) => {
  return subjects.map((subject, index) => {
    const currentPercentage = subject.percentage;
    const totalClasses = subject.total;
    const attendedClasses = subject.attended;
    
    // Calculate required additional classes
    const requiredClasses = currentPercentage < targetPercentage ? 
      Math.ceil((targetPercentage * totalClasses - 100 * attendedClasses) / (100 - targetPercentage)) : 
      0;

    return {
      id: index + 1,
      subject: subject.name,
      status: (subject.percentage >= 75 
         ? 'Enough' 
         : 'Low'),
      happened: subject.total,
      attended: subject.attended,
      percentage: subject.percentage.toFixed(1),
      requirments: requiredClasses
    };
  });
};