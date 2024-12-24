import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required:true
  },
  presetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Preset',
    required: true
  },
  schedule: [{
    day: String,
    periods: [{
      subject: String,
      startTime: String,
      endTime: String,
      temporaryExchange: {
        type: {
          originalSubject: String,
          exchangeEndDate: Date
        },
        required: false,
        default: undefined
      }
    }]
  }]
}, { timestamps: true });

// Add pre-save middleware to cleanup expired exchanges
timetableSchema.pre('save', function(next) {
  const currentDate = new Date();
  
  this.schedule.forEach(day => {
    day.periods.forEach(period => {
      if (period.temporaryExchange?.exchangeEndDate && 
          new Date(period.temporaryExchange.exchangeEndDate) < currentDate) {
        // Restore original subject
        period.subject = period.temporaryExchange.originalSubject;
        period.temporaryExchange = null;
      }
    });
  });
  
  next();
});
  
export const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);