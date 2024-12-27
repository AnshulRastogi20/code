import { ClassInfoInterface } from "@/types";
import mongoose from "mongoose";
import { SubjectInfo } from "../types";

const classInfoSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        unique: true
    },

    subject: [{
        name:{
            type: String,
            required: true
        },
        allclasses: [{
            date: {
                type: Date,
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
            isHoliday: { 
                type: Boolean, 
                default: false 
            },
            happened: {
                type: Boolean,
                required: true,
                default: false,
                
            },
            attended: {
                type: Boolean,
                default: false,
                required: true,
                
            },
            topicsCovered: {
                type: [String],
                default: []
            },
            temporarySubject: {
                type: mongoose.Schema.Types.Mixed,
                default: null,
                required: false
            },
            exchangeEndDate: {
                type: mongoose.Schema.Types.Mixed,
                default: null,
                required: false
            }
        }],
        allHappened:{
            type: Number,
        },

        allAttended:{
            type: Number,
        }

    }],
    

}, 
{ timestamps: true });

classInfoSchema.pre<ClassInfoInterface>('validate', function (next) {
    // Clean up holiday class data
    this.subject.forEach((subject:SubjectInfo) => {
      subject.allclasses.forEach((cls) => {
        if (cls.isHoliday) {
          // Preserve only date and isHoliday fields
          cls.startTime = '';
          cls.endTime = '';
          cls.happened = false;
          cls.attended = false;
          cls.topicsCovered = [];
          cls.temporarySubject = null;
          cls.exchangeEndDate = null;
        }
      });
    });

    let validationError = null;
    
    this.subject.forEach((subject:SubjectInfo) => {
      subject.allclasses.forEach((cls) => {
        // Holiday validation
        if (cls.isHoliday && (cls.happened || cls.attended)) {
          cls.happened = false;
          cls.attended = false;
          validationError = new Error('Class cannot be marked as happened or attended when it is a holiday');
        }
        
        // Topics covered validation
        if (cls.topicsCovered.length > 0 && (!cls.happened || !cls.attended)) {
          cls.topicsCovered = []; // Reset topics when validation fails
          validationError = new Error('Topics can only be added if class happened and was attended');
        }

        // Attended dependency validation
        if (cls.attended && !cls.happened) {
          cls.attended = false; // Reset attended to false
          validationError = new Error('Class cannot be marked as attended if it has not happened');
        }
      });
    });
    
    next(validationError);
});

// Add pre-save middleware to handle temporary exchanges
classInfoSchema.pre('save', function(next) {
    const currentDate = new Date();
    
    this.subject.forEach(subj => {
      subj.allclasses.forEach(cls => {
        // Handle expired temporary exchanges
        if (cls.exchangeEndDate && new Date(cls.exchangeEndDate) < currentDate) {
          cls.temporarySubject = null;
          cls.exchangeEndDate = null;
        }
        
        // Update attendance counts after exchange
        if (cls.temporarySubject) {
          const targetSubject = this.subject.find(s => s.name === cls.temporarySubject.subject);
          if (targetSubject) {
            targetSubject.allHappened = targetSubject.allclasses.filter(c => c.happened).length;
            targetSubject.allAttended = targetSubject.allclasses.filter(c => c.attended).length;
          }
        }
      });
    });
    
    next();
  });

export const ClassInfo = mongoose.models.ClassInfo || mongoose.model('ClassInfo', classInfoSchema);
