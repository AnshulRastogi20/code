// scripts/seed-presets.ts
import { connectDB } from '@/lib/db';
import { Preset } from '@/models/Preset';

const defaultPresets = [
  {
    name: 'Morning Schedule',
    description: 'Classes from 8 AM to 2 PM',
    schedule: [
      {
        day: 'Monday',
        periods: [
          { subject: 'Mathematics', startTime: '08:00', endTime: '09:00' },
          { subject: 'Physics', startTime: '09:15', endTime: '10:15' },
          // ... more periods
        ]
      },
      // ... more days
    ],
    isDefault: true
  }
  // ... more presets
];

async function seedPresets() {
  await connectDB();
  await Preset.deleteMany({ isDefault: true });
  await Preset.insertMany(defaultPresets);
  console.log('Default presets seeded successfully');
}

seedPresets();