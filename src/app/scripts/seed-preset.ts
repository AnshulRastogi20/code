// scripts/seed-presets.ts
import { connectDB } from '@/lib/db';
import { Preset } from '@/models/Preset';

const defaultPresets = [
  {
    name: 'TEST',
    description: 'Classes from 9:15 AM to 3:45 PM',
    schedule: [
        {
            day: 'MONDAY',
            periods: [
              {
                subject: 'ORGANON',
                startTime: '09:15',
                endTime: '10:00',
                teacher: 'DR. PRIYANKA',  
              },
              {
                subject: 'Physics',
                startTime: '10:00',
                endTime: '10:45',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Mathematics',
                startTime: '10:45',
                endTime: '11:30',
                teacher: 'Mr. Smith', 
              },
              {
                subject: 'Physics',
                startTime: '11:30',
                endTime: '12:15',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'ORGANON',
                startTime: '12:15',
                endTime: '01:00',
                teacher: 'DR. PRIYANKA', 
              },
              {
                subject: 'Physics',
                startTime: '01:00',
                endTime: '01:30',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Mathematics',
                startTime: '01:30',
                endTime: '02:15',
                teacher: 'Mr. Smith', 
              },
              {
                subject: 'Physics',
                startTime: '02:15',
                endTime: '03:00',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Physics',
                startTime: '03:00',
                endTime: '03:45',
                teacher: 'Mrs. Johnson',
              }
              // ... more periods
            ]
          },
          {
            day: 'TUESDAY',
            periods: [
              {
                subject: 'ORGANON',
                startTime: '09:15',
                endTime: '10:00',
                teacher: 'DR. PRIYANKA',  
              },
              {
                subject: 'Physics',
                startTime: '10:00',
                endTime: '10:45',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Mathematics',
                startTime: '10:45',
                endTime: '11:30',
                teacher: 'Mr. Smith', 
              },
              {
                subject: 'Physics',
                startTime: '11:30',
                endTime: '12:15',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'ORGANON',
                startTime: '12:15',
                endTime: '01:00',
                teacher: 'DR. PRIYANKA', 
              },
              {
                subject: 'Physics',
                startTime: '01:00',
                endTime: '01:30',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Mathematics',
                startTime: '01:30',
                endTime: '02:15',
                teacher: 'Mr. Smith', 
              },
              {
                subject: 'Physics',
                startTime: '02:15',
                endTime: '03:00',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Physics',
                startTime: '03:00',
                endTime: '03:45',
                teacher: 'Mrs. Johnson',
              }
              // ... more periods
            ]
          },
          {
            day: 'WEDNESDAY',
            periods: [
              {
                subject: 'ORGANON',
                startTime: '09:15',
                endTime: '10:00',
                teacher: 'DR. PRIYANKA',  
              },
              {
                subject: 'Physics',
                startTime: '10:00',
                endTime: '10:45',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Mathematics',
                startTime: '10:45',
                endTime: '11:30',
                teacher: 'Mr. Smith', 
              },
              {
                subject: 'Physics',
                startTime: '11:30',
                endTime: '12:15',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'ORGANON',
                startTime: '12:15',
                endTime: '01:00',
                teacher: 'DR. PRIYANKA', 
              },
              {
                subject: 'Physics',
                startTime: '01:00',
                endTime: '01:30',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Mathematics',
                startTime: '01:30',
                endTime: '02:15',
                teacher: 'Mr. Smith', 
              },
              {
                subject: 'Physics',
                startTime: '02:15',
                endTime: '03:00',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Physics',
                startTime: '03:00',
                endTime: '03:45',
                teacher: 'Mrs. Johnson',
              }
              // ... more periods
            ]
          },
          {
            day: 'THURSDAY',
            periods: [
              {
                subject: 'ORGANON',
                startTime: '09:15',
                endTime: '10:00',
                teacher: 'DR. PRIYANKA',  
              },
              {
                subject: 'Physics',
                startTime: '10:00',
                endTime: '10:45',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Mathematics',
                startTime: '10:45',
                endTime: '11:30',
                teacher: 'Mr. Smith', 
              },
              {
                subject: 'Physics',
                startTime: '11:30',
                endTime: '12:15',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'ORGANON',
                startTime: '12:15',
                endTime: '01:00',
                teacher: 'DR. PRIYANKA', 
              },
              {
                subject: 'Physics',
                startTime: '01:00',
                endTime: '01:30',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Mathematics',
                startTime: '01:30',
                endTime: '02:15',
                teacher: 'Mr. Smith', 
              },
              {
                subject: 'Physics',
                startTime: '02:15',
                endTime: '03:00',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Physics',
                startTime: '03:00',
                endTime: '03:45',
                teacher: 'Mrs. Johnson',
              }
              // ... more periods
            ]
          },
          {
            day: 'FRIDAY',
            periods: [
              {
                subject: 'ORGANON',
                startTime: '09:15',
                endTime: '10:00',
                teacher: 'DR. PRIYANKA',  
              },
              {
                subject: 'Physics',
                startTime: '10:00',
                endTime: '10:45',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Mathematics',
                startTime: '10:45',
                endTime: '11:30',
                teacher: 'Mr. Smith', 
              },
              {
                subject: 'Physics',
                startTime: '11:30',
                endTime: '12:15',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'ORGANON',
                startTime: '12:15',
                endTime: '01:00',
                teacher: 'DR. PRIYANKA', 
              },
              {
                subject: 'Physics',
                startTime: '01:00',
                endTime: '01:30',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Mathematics',
                startTime: '01:30',
                endTime: '02:15',
                teacher: 'Mr. Smith', 
              },
              {
                subject: 'Physics',
                startTime: '02:15',
                endTime: '03:00',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Physics',
                startTime: '03:00',
                endTime: '03:45',
                teacher: 'Mrs. Johnson',
              }
              // ... more periods
            ]
          },
          {
            day: 'SATURDAY',
            periods: [
              {
                subject: 'ORGANON',
                startTime: '09:15',
                endTime: '10:00',
                teacher: 'DR. PRIYANKA',  
              },
              {
                subject: 'Physics',
                startTime: '10:00',
                endTime: '10:45',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'Mathematics',
                startTime: '10:45',
                endTime: '11:30',
                teacher: 'Mr. Smith', 
              },
              {
                subject: 'Physics',
                startTime: '11:30',
                endTime: '12:15',
                teacher: 'Mrs. Johnson',
              },
              {
                subject: 'ORGANON',
                startTime: '12:15',
                endTime: '01:00',
                teacher: 'DR. PRIYANKA', 
              }
              // ... more periods
            ]
          }
      // ... more days
    ],
    isDefault: true
  }
  // ... more presets
];

export async function seedPresets() {
  await connectDB();
  await Preset.deleteMany({ isDefault: true });
  await Preset.insertMany(defaultPresets);
  console.log('Default presets seeded successfully');
}

