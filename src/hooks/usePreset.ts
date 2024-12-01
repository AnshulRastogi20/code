// hooks/usePresets.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

export function usePresets() {
  const { data: presets, isLoading } = useQuery({
    queryKey: ['presets'],
    queryFn: async () => {
      const { data } = await axios.get('/api/presets');
      return data;
    }
  });

  const applyPreset = useMutation({
    mutationFn: async (presetId: string) => {
      const { data } = await axios.post('/api/user/timetable', { presetId });
      return data;
    }
  });

  return { presets, isLoading, applyPreset };
}