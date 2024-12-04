import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    schedule: [{
      day: String,
      periods: [{
        subject: String,
        startTime: String,
        endTime: String
      }]
    }]
  }, { timestamps: true });
  
  export const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);