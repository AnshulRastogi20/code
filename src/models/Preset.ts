// models/Preset.ts
import mongoose from 'mongoose';

const periodSchema = new mongoose.Schema({
  subject: String,
  startTime: String,
  endTime: String,
  teacher: String,
});

const dayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
  },
  periods: [periodSchema]
});

const presetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  schedule: [dayScheduleSchema],
  isDefault: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Preset = mongoose.models.Preset || mongoose.model('Preset', presetSchema);