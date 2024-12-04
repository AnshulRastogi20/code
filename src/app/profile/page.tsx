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


    const [selectedPreset, setSelectedPreset] = useState('')
     const [presetState, setPreset] = useState<Preset[]>()
    
    useEffect(() => {
        // Fetch presets from API
        const fetchPresets = async () => {
            try {
                const response = await axios.get('/api/preset')
                console.log(response)
                setPreset(response.data.map((preset: Preset)=> ({
                    id: preset.id,
                    name: preset.name
                })))
            } catch (error) {
                console.error('Failed to fetch presets:', error)
            }
        }

        fetchPresets()
    }, [])


const { timetable, presets, applyPreset } = useTimetable();

  const handleApplyPreset = async (presetId: string) => {
    try {
      await applyPreset.mutateAsync(presetId);
      toast.success('Timetable updated');
    } catch {
      toast.error('Failed to update timetable');
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
                                {presetState?.map((presetState:Preset , index) => (
                                    <SelectItem key={index} value={presetState.id}>
                                        {presetState.name}
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