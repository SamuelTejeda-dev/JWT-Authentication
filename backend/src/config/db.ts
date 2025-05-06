import mongoose from "mongoose";
import { MONGO_URI } from "../constants/env";

//connect to DB

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Successfully connected to DB!");
  } catch (error) {
    console.log("could not connect to database", error);
    process.exit(1);
  }
};

export default connectToDatabase;
