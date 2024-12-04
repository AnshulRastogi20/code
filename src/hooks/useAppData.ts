// hooks/useAppData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api-services';

export function useAttendance() {
  const queryClient = useQueryClient();

  const attendanceQuery = useQuery({
    queryKey: ['attendance'],
    queryFn: apiService.getAttendance
  });

  const markAttendanceMutation = useMutation({
    mutationFn: apiService.markAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });

  return {
    attendance: attendanceQuery.data,
    isLoading: attendanceQuery.isLoading,
    error: attendanceQuery.error,
    markAttendance: markAttendanceMutation.mutate
  };
}

export function useTimetable() {
  const queryClient = useQueryClient();

  return {
    timetable: useQuery({
      queryKey: ['timetable'],
      queryFn: apiService.getTimetable
    }),
    presets: useQuery({
      queryKey: ['presets'],
      queryFn: apiService.getPresets
    }),
    applyPreset: useMutation({
      mutationFn: apiService.applyPreset,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['timetable'] });
      }
    })
  };
}