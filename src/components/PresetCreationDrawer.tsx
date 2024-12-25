"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useState } from "react"
import { Plus, Trash } from "lucide-react"
import { toast } from "sonner"
import axios from 'axios'
import { Period } from "@/types"

// type Period = {
//   subject: string
//   startTime: string
//   endTime: string
//   teacher: string
// }

type DaySchedule = {
  day: string
  periods: Period[]
}

export function PresetCreationDrawer() {
  const [presetName, setPresetName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: "MONDAY", periods: [] },
    { day: "TUESDAY", periods: [] },
    { day: "WEDNESDAY", periods: [] },
    { day: "THURSDAY", periods: [] },
    { day: "FRIDAY", periods: [] },
    { day: "SATURDAY", periods: [] },
  ])

  const addPeriod = (dayIndex: number) => {
    const newSchedule = [...schedule]
    newSchedule[dayIndex].periods.push({
      subject: "",
      startTime: "",
      endTime: "",
      teacher: "",
      date: new Date(),
      temporaryExchange: null
    })
    setSchedule(newSchedule)
  }

  const removePeriod = (dayIndex: number, periodIndex: number) => {
    const newSchedule = [...schedule]
    newSchedule[dayIndex].periods.splice(periodIndex, 1)
    setSchedule(newSchedule)
  }

  const updatePeriod = (
    dayIndex: number,
    periodIndex: number,
    field: keyof Period,
    value: string
  ) => {
    const newSchedule = [...schedule]
    newSchedule[dayIndex].periods[periodIndex] = {
      ...newSchedule[dayIndex].periods[periodIndex],
      [field]: value
    }
    setSchedule(newSchedule)
  }

  const handleSubmit = async () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name")
      return
    }

    setIsLoading(true)
    try {
      await axios.post('/api/presets', {
        name: presetName,
        schedule: schedule,
        isDefault: false,
        createdBy: "user",
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      })

      toast.success("Preset created successfully!")
      setPresetName("")
      setSchedule([
        { day: "MONDAY", periods: [] },
        { day: "TUESDAY", periods: [] },
        { day: "WEDNESDAY", periods: [] },
        { day: "THURSDAY", periods: [] },
        { day: "FRIDAY", periods: [] },
        { day: "SATURDAY", periods: [] },
      ])
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to create preset")
        console.error('Axios error:', error.response?.data)
      } else {
        toast.error("An unexpected error occurred")
        console.error('Unexpected error:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="w-full">Create New Timetable</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className=" text-black mx-auto w-full max-w-4xl">
          <DrawerHeader>
            <DrawerTitle>Create New Timetable Preset</DrawerTitle>
            <DrawerDescription>
              Fill in the details for your new timetable preset.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <Input
              placeholder="Preset Name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="text-black mb-4"
            />
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {schedule.map((day, dayIndex) => (
                <div key={day.day} className="border p-4 rounded-lg">
                  <h3 className="font-bold mb-2">{day.day}</h3>
                  {day.periods.map((period, periodIndex) => (
                    <div
                      key={periodIndex}
                      className="grid grid-cols-4 gap-2 mb-2"
                    >
                      <Input
                        placeholder="Subject"
                        value={period.subject}
                        className="text-black"
                        onChange={(e) =>
                          updatePeriod(
                            dayIndex,
                            periodIndex,
                            "subject",
                            e.target.value
                          )
                        }
                      />
                      <Input
                        placeholder="Start Time (HH:MM)"
                        value={period.startTime}
                        className="text-black"
                        onChange={(e) =>
                          updatePeriod(
                            dayIndex,
                            periodIndex,
                            "startTime",
                            e.target.value
                          )
                        }
                      />
                      <Input
                        placeholder="End Time (HH:MM)"
                        value={period.endTime}
                        className="text-black"
                        onChange={(e) =>
                          updatePeriod(
                            dayIndex,
                            periodIndex,
                            "endTime",
                            e.target.value
                          )
                        }
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Teacher"
                          value={period.teacher}
                          className="text-black"
                          onChange={(e) =>
                            updatePeriod(
                              dayIndex,
                              periodIndex,
                              "teacher",
                              e.target.value
                            )
                          }
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removePeriod(dayIndex, periodIndex)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPeriod(dayIndex)}
                    className="text-black mt-2"
                  >
                    <Plus className="text-black h-4 w-4 mr-2" />
                    Add Period
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DrawerFooter>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Preset"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
} 