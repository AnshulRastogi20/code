'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Preset } from '@/types'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useTimetable } from '@/hooks/useAppData'
import { useRouter } from "next/navigation"
import AppTheme from '@/components/shared-theme/AppTheme'
import {
  Button,
  Card,
  CardContent,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  Select,
  Typography,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material'
import { PresetCreationDrawer } from "@/components/PresetCreationDrawer"
import {
    chartsCustomizations,
    dataGridCustomizations,
    datePickersCustomizations,
  } from '@/components/shared-theme/customizations';
const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
};

export default function TimetablePage() {
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [presets, setPresets] = useState<Preset[]>([])
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    applyPreset: false
  });
  const router = useRouter()
  const { applyPreset } = useTimetable()
  const { data: session } = useSession()



  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      try {
        const [presetsResponse, currentResponse] = await Promise.all([
          axios.get<Preset[]>('/api/presets'),
          axios.get<Preset>('/api/user/timetable/current')
        ])
        
        if (mounted) {
          setPresets(presetsResponse.data.map(preset => ({
            _id: preset._id,
            name: preset.name,
            schedule: preset.schedule,
            createdBy: preset.createdBy
          })))
          setCurrentPreset(currentResponse.data)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data')
      }
    }

    fetchData()
    
    return () => {
      mounted = false
    }
  }, [])

  const refreshPresets = async () => {
    try {
      const presetsResponse = await axios.get<Preset[]>('/api/presets');
      setPresets(presetsResponse.data.map(preset => ({
        _id: preset._id,
        name: preset.name,
        schedule: preset.schedule,
        createdBy: preset.createdBy
      })));
    } catch (error) {
      console.error('Failed to refresh presets:', error);
      toast.error('Failed to refresh presets');
    }
  };

  const handleApplyPreset = async (presetId: string) => {
    if (loadingStates.applyPreset) return;

    if (currentPreset) {
      setShowConfirmDialog(true);
      setPendingPresetId(presetId);
      return;
    }
    
    await applyPresetChanges(presetId);
  };

  const applyPresetChanges = async (presetId: string) => {
    setLoadingStates(prev => ({ ...prev, applyPreset: true }));
    try {
      if (currentPreset) {
        await axios.delete('/api/classinfo');
      }
      
      await applyPreset.mutateAsync(presetId);
      await axios.post('/api/classinfo');
      
      toast.success('Timetable updated successfully');
      router.push('/start');
    } catch (error) {
      console.error('Failed to apply preset:', error);
      toast.error('Failed to update timetable');
    } finally {
      setLoadingStates(prev => ({ ...prev, applyPreset: false }));
    }
  };

  return (
    <AppTheme themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* User Info Card */}
          <Grid item xs={12} md={6}>
          <Card 
            variant= 'outlined'
            sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        mx:2,
                        p:4
                      }}>
            
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Welcome
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {session?.user?.name || 'User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {session?.user?.email}
                </Typography>
                </CardContent>
            </Card>
          </Grid>

          {/* Current Timetable Card */}
          <Grid item xs={12} md={6}>
          <Card 
            variant= 'outlined'
            sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        mx:2,
                        p:4
                      }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Current Active Timetable
                </Typography>
                {currentPreset ? (
                  <Typography variant="h5" align="center" sx={{ mt: 2 }}>
                    {currentPreset.name}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center">
                    No timetable currently active
                  </Typography>
                )}
            </Card>
          </Grid>

          {/* Custom Timetable Card */}
          <Grid item xs={12} md={6}>
            <Card 
            variant= 'outlined'
            sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        mx:2,
                        p:4                      
                      }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Set Custom Timetable
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create and customize your own timetable according to your schedule.
                </Typography>
                <PresetCreationDrawer onPresetCreated={refreshPresets} />
            </Card>
          </Grid>

          {/* Preset Timetable Card */}
          <Grid item xs={12} md={6}>
            <Card 
            variant= 'outlined'
            sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        mx:2,
                        p:4
                      }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Choose Preset Timetable
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select from pre-configured timetable templates.
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Preset</InputLabel>
                  <Select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    label="Select Preset"
                  >
                    {presets?.map((preset: Preset) => (
                      <MenuItem key={preset._id} value={preset._id}>
                        {preset.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedPreset && (
                    <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleApplyPreset(selectedPreset)}
                    disabled={!selectedPreset || loadingStates.applyPreset}
                    sx={{ mt: 1 }}
                  >
                    {loadingStates.applyPreset ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Apply Preset"
                    )}
                  </Button>
                )}
            </Card>
          </Grid>
        </Grid>

        {/* Confirmation Dialog */}
        <Dialog
          open={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
        >
          <DialogTitle>
            Confirm Timetable Change
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Changing timetable will delete today`s attendance records. Are you sure you want to proceed?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingPresetId(null);
              }}
              color="inherit"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (pendingPresetId) {
                  applyPresetChanges(pendingPresetId);
                  setShowConfirmDialog(false);
                  setPendingPresetId(null);
                }
              }}
              variant="contained"
              color="primary"
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppTheme>
  )
}