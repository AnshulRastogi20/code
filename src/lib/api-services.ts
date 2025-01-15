// lib/api-service.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

export const apiService = {

  // Timetable
  getTimetable: () => api.get('/user/timetable').then(res => res.data),
  applyPreset: (presetId: string) => 
    api.post('/user/timetable', { presetId }).then(res => res.data),
  
  // Presets
  getPresets: () => api.get('/presets').then(res => res.data)
};