import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },

    subject: [{
        type: String,
        required: true,
    
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
                    default: false
                },
            
                attended: {
                    type: Boolean,
                    default: false,
                    required: true
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

export const Class = mongoose.models.Class || mongoose.model('Class', attendanceSchema);
