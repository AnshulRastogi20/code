import mongoose from "mongoose";

type ConnectionObject = {
    isConnected?: number
}
const connection: ConnectionObject = {}

// let cached = global.mongoose;

// if (!cached) {
//   cached = global.mongoose = { conn: null, promise: null };
// }

export async function connectDB() {
    if (connection.isConnected) {
        console.log("already connected")
        return
    } 
//   if (cached.conn) return cached.conn;

//   cached.promise = mongoose.connect(MONGODB_URI);
//   cached.conn = await cached.promise;
//   return cached.conn;
try {
        const db = await mongoose.connect(process.env.MONGODB_URI || "" , {})

        connection.isConnected = db.connections[0].readyState
        console.log("DB connected succesfully")

    } catch (error) {
        console.log("error in db connect" , error)
        process.exit(1)
    }
}

export default connectDB
