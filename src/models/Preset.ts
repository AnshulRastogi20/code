// models/Preset.ts
import mongoose from 'mongoose';

const periodSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  teacher: {
    type: String,
    required: false
  }
});

const dayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  },
  periods: [periodSchema]
});

const presetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  schedule: [dayScheduleSchema],
  isDefault: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Preset = mongoose.models.Preset || mongoose.model('Preset', presetSchema);