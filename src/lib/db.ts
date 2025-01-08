import mongoose from "mongoose";

type ConnectionObject = {
    isConnected?: number
}
const connection: ConnectionObject = {}


export async function connectDB() {
    if (connection.isConnected) {
        console.log("already connected")
        return
    } 

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
