import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: { 
    type: String, 
    unique: true 
},
  image: String,
  googleId: String,
  timetableId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);