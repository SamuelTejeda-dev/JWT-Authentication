import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
} from "../constants/http";
import VerificationCodeType from "../constants/verificationCodeType";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import {
  ONE_DAY_MS,
  oneYearFromNow,
  thirtyDaysFormNow,
  fiveMinutesAgo,
  oneHourFromNow,
} from "../utils/date";
import appAssert from "../utils/AppAssert";
import {
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from "../utils/jwt";
import { sendMail } from "../utils/sendMail";
import {
  getPasswordResetTemplate,
  getVerifyEmailTemplate,
} from "../utils/emailTemplates";
import { APP_ORIGIN } from "../constants/env";
import { hashValue } from "../utils/bcrypt";

export type CreateAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};

//Funzione per creare un nuovo account

export const createAccount = async (data: CreateAccountParams) => {
  //verify existing user doesn't exist
  const existingUser = await UserModel.exists({
    email: data.email,
  });
  //if (existingUser) throw new Error("User already exists");
  appAssert(!existingUser, CONFLICT, "Email already in use!");
  //Create user
  const user = await UserModel.create({
    email: data.email,
    password: data.password,
  });
  const userId = user._id;
  //Create verification code
  const verificationCode = await VerificationCodeModel.create({
    userId,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
  });
  //send verification email
  const url = `${APP_ORIGIN}/email/verifi/${verificationCode._id}`;

  const { error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });

  if (error) {
    console.log(error);
  }

  //Create session
  const session = await SessionModel.create({
    userId,
    userAgent: data.userAgent,
  });
  //sign accesso token & refresh token
  const refreshToken = signToken({
    sessionId: session._id,
  });

  // const refreshToken = jwt.sign(
  //   { sessionId: session._id },
  //   JWT_REFRESH_SECRET,
  //   { audience: ["user"], expiresIn: "30d" }
  // );

  const accessToken = signToken({
    userId,
    sessionId: session._id,
  });

  // const accessToken = jwt.sign(
  //   { userId: user._id, sessionId: session._id },
  //   JWT_SECRET,
  //   {
  //     audience: ["user"],
  //     expiresIn: "15m",
  //   }

  //Return user & tokens
  return { user: user.omitPassword(), accessToken, refreshToken };
};

type LoginParams = {
  email: string;
  password: string;
  userAgent?: string;
};

//Funzione per il login dell'utente

export const loginUser = async ({
  email,
  password,
  userAgent,
}: LoginParams) => {
  //Get the user by emai
  // await UserModel.deleteMany({});
  // await SessionModel.deleteMany({});
  // await VerificationCodeModel.deleteMany({});

  const user = await UserModel.findOne({ email });
  appAssert(user, UNAUTHORIZED, "Invalid email or password!");

  //validate password from the request
  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Invalid email or password!");

  const userId = user._id;
  //Create a session
  const session = await SessionModel.create({ userId, userAgent });

  const sessionInfo = {
    sessionId: session._id,
  };
  //sign access and refresh token
  const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);
  // jwt.sign(sessionInfo, JWT_REFRESH_SECRET, {
  //   audience: ["user"],
  //   expiresIn: "30d",
  // });

  const accessToken = signToken({ ...sessionInfo, userId });

  // const accessToken = jwt.sign(
  //   { ...sessionInfo, userId: user._id },
  //   JWT_SECRET,
  //   {
  //     audience: ["user"],
  //     expiresIn: "15m",
  //   }
  // );

  //return user & tokens
  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  //controlla se il payload esiste
  appAssert(payload, UNAUTHORIZED, "Invalid refresh token!");

  const session = await SessionModel.findById(payload.sessionId);

  const now = Date.now();
  //controlla se la sessione esiste
  appAssert(
    session && session.expiresAt.getTime() > now,
    UNAUTHORIZED,
    "Session expired!"
  );

  //controlla se la sessione sta per scadere
  const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;

  if (sessionNeedsRefresh) {
    session.expiresAt = thirtyDaysFormNow();
    await session.save();
  }
  //creiamo un nuovo refresh token perchè quello precedente è scaduto
  const newRefreshToken = sessionNeedsRefresh
    ? signToken(
        {
          sessionId: session._id,
        },
        refreshTokenSignOptions
      )
    : undefined;

  const accessToken = signToken({
    userId: session.userId,
    sessionId: session._id,
  });

  return {
    accessToken,
    newRefreshToken,
  };
};

export const verifyEmail = async (code: string) => {
  //get the verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: code,
    type: VerificationCodeType.EmailVerification,
    expiresAt: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, "Invalid or expired verification code!");
  //get user by ID and update user verified to true
  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      verified: true,
    },
    //return the updated user
    { new: true }
  );

  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failded to verify email!");
  //delete verification code
  await validCode.deleteOne();
  //return user
  return { user: updatedUser.omitPassword() };
};

export const sendPasswordResetEmail = async (email: string) => {
  //get the user by email
  const user = await UserModel.findOne({ email });
  appAssert(user, NOT_FOUND, "User not found!");
  //check email rate limit
  const fiveMinAgo = fiveMinutesAgo();
  //count è il numero di codici di verifica creati negli ultimi 5 minuti
  //CreatedAt
  const count = await VerificationCodeModel.countDocuments({
    userId: user._id,
    type: VerificationCodeType.PasswordReset,
    createdAt: { $gt: fiveMinAgo },
  });
  appAssert(
    count <= 1,
    TOO_MANY_REQUESTS,
    "Too many requests!, please try again later!"
  );
  //create verification code
  const expiresAt = oneHourFromNow();
  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeType.PasswordReset,
    expiresAt,
  });
  //send verification email

  //exp ci permette di dire al frontend che il codice è scaduto e di evitare di fare la richiesta al backend se il link è già scaduto
  const url = `${APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${expiresAt.getTime()}`;
  const { data, error } = await sendMail({
    to: user.email,
    ...getPasswordResetTemplate(url),
  });
  appAssert(
    data?.id,
    INTERNAL_SERVER_ERROR,
    `${error?.name} - ${error?.message}`
  );
  //return success
  return {
    url,
    emailId: data.id,
  };
};

type ResetPasswordParams = {
  password: string;
  verificationCode: string;
};

export const resetPassword = async ({
  password,
  verificationCode,
}: ResetPasswordParams) => {
  //get the verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: verificationCode,
    type: VerificationCodeType.PasswordReset,
    expiresAt: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, "Invalid or expired verification code!");
  //update user password
  const updateUser = await UserModel.findByIdAndUpdate(validCode.userId, {
    password: await hashValue(password),
  });

  appAssert(updateUser, INTERNAL_SERVER_ERROR, "Failed to reset password!");
  //delete the verification code
  await validCode.deleteOne();
  //delete all sessions
  await SessionModel.deleteMany({
    userId: updateUser._id,
  });

  return {
    user: updateUser.omitPassword(),
  };
};
