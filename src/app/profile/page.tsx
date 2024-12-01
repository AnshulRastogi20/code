'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfilePage() {
    const [selectedPreset, setSelectedPreset] = useState('')

    // Example presets - replace with your actual presets
    const presets = [
        { id: '1', name: 'Default Schedule' },
        { id: '2', name: 'Morning Schedule' },
        { id: '3', name: 'Evening Schedule' },
    ]

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
                                {presets.map((preset) => (
                                    <SelectItem key={preset.id} value={preset.id}>
                                        {preset.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button 
                            onClick={() => console.log('Applied preset:', selectedPreset)}
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