import mongoose from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";

//Definisce il modello dell'utente

export interface UserDocument extends mongoose.Document {
  email: string;
  password: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
  comparePassword(val: string): Promise<boolean>;
  omitPassword(): Pick<
    UserDocument,
    "_id" | "email" | "verified" | "createdAt" | "updatedAt" | "__v"
  >;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    email: { type: String, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  }
);

//method that hash password
userSchema.pre("save", async function (next) {
  //Check if password has not been modified
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await hashValue(this.password);
  next();
});

//method that compare password
userSchema.methods.comparePassword = async function (value: string) {
  //value is user.value, this password is the password in DB
  return compareValue(value, this.password);
};

userSchema.methods.omitPassword = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

//create model in database
const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;
