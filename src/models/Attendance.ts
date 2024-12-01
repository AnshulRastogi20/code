import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    date: Date,
    periods: [{
      subject: String,
      startTime: String,
      endTime: String,
      attended: Boolean,
      disabled: Boolean,
      topicsCovered: String
    }],
    isHoliday: { 
        type: Boolean, 
        default: false 
    }
  }, { timestamps: true });
  
  export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);