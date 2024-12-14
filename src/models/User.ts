import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
  name: String,
  email: { 
    type: String, 
    unique: true 
  },
  image: String,
  googleId: String,
  timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' },
  selectedPreset: { type: mongoose.Schema.Types.String, ref: 'Preset' },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);