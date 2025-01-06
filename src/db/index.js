import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async ()=>{
    try {
       const conenctionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`\n MONGODB connected! DB host: ${conenctionInstance.connection.host}`);
       
        
    } catch (error) {
        console.log("MongoDB connection error",error);
        process.exit(1)
    }
}

export default connectDB