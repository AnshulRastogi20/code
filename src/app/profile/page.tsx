'use client'

import { Preset } from '@/types'
import { toast } from 'react-hot-toast' 
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import axios from 'axios'
import { useTimetable } from '@/hooks/useAppData'
import { PresetCreationDrawer } from "@/components/PresetCreationDrawer"
import { useRouter } from "next/navigation";

export default function ProfilePage() {

  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [presets, setPresets] = useState<Preset[]>([])
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { applyPreset } = useTimetable()

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      try {
        setIsLoading(true)
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
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      mounted = false
    }
  }, [])

  const handleApplyPreset = async (presetId: string) => {
    try {
      await applyPreset.mutateAsync(presetId)
      
      await axios.post('/api/classinfo');
      
      toast.success('Timetable updated and Blank Attendence Record Created')
      router.push('/start')

    } catch (error) {
      console.error('Failed to apply preset:', error)
      toast.error('Failed to update timetable')
    }
  
  };

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
            
            <div className="grid gap-6 md:grid-cols-2">
                {/* Current Timetable Card - Moved to top */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Current Active Timetable</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentPreset ? (
                            <p className="text-lg font-semibold text-center">
                                {currentPreset.name}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 text-center">
                                No timetable currently active
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Set Custom Timetable</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                            Create and customize your own timetable according to your schedule.
                        </p>
                        <PresetCreationDrawer />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Choose Preset Timetable</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                            Select from pre-configured timetable templates.
                        </p>
                        <Select
                            value={selectedPreset}
                            onValueChange={setSelectedPreset}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a preset timetable" />
                            </SelectTrigger>
                            <SelectContent>
                                {presets?.map((preset:Preset , index) => (
                                    <SelectItem key={index} value={preset._id}>
                                        {preset.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button 
                            onClick={() => handleApplyPreset(selectedPreset)}
                            className="w-full mt-4"
                            disabled={!selectedPreset}
                        >
                            Apply Preset
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}