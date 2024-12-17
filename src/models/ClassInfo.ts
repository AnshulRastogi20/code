import { ClassInfoInterface } from "@/types";
import mongoose from "mongoose";

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

classInfoSchema.pre<ClassInfoInterface>('validate', function (next:any) {
    let validationError = null;
    
    this.subject.forEach((subject) => {
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

export const ClassInfo = mongoose.models.ClassInfo || mongoose.model('ClassInfo', classInfoSchema);
