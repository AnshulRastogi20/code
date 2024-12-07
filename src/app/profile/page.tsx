'use client'

import { Preset } from '@/types'
import {toast} from 'react-hot-toast'
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

export default function ProfilePage() {


    const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [presets, setPresets] = useState<Preset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const { applyPreset } = useTimetable()

  useEffect(() => {
    let mounted = true
    
    const fetchPresets = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get<Preset[]>('/api/presets')
        
        if (mounted) {
          setPresets(response.data.map(presets => ({
            _id: presets._id,
            name: presets.name,
            schedule: presets.schedule,
            createdBy: presets.createdBy
          })))
        }
      } catch (error) {
        console.error('Failed to fetch presets:', error)
        toast.error('Failed to load presets')
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchPresets()
    
    return () => {
      mounted = false
    }
  }, []) // Remove setSelectedPreset from deps

  const handleApplyPreset = async (presetId: string) => {
    try {
      await applyPreset.mutateAsync(presetId)
      toast.success('Timetable updated')
    } catch (error) {
      console.error('Failed to apply preset:', error)
      toast.error('Failed to update timetable')
    }
  
  };




    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
            
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Set Custom Timetable</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                            Create and customize your own timetable according to your schedule.
                        </p>
                        <Button 
                            onClick={() => window.location.href = '/profile/set-timetable'}
                            className="w-full"
                        >
                            Create New Timetable
                        </Button>
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