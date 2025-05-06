import { Router } from "express";
import {
  logoutHandler,
  refreshHandler,
  registerHandler,
  resetPasswordHandler,
  sendPasswordResetHandler,
  verifyEmailHandler,
} from "../controllers/auth.controller";
import { loginHandler } from "../controllers/auth.controller";
import { OK } from "../constants/http";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";

//Le route di autenticazione

const authRoutes = Router();

authRoutes.post("/register", registerHandler);
authRoutes.post("/login", loginHandler);
authRoutes.get("/logout", logoutHandler);
authRoutes.get("/refresh", refreshHandler);
authRoutes.get("/email/verify/:code", verifyEmailHandler);
authRoutes.post("/password/forgot", sendPasswordResetHandler);
authRoutes.post("/password/reset", resetPasswordHandler);
authRoutes.get("/cancellaTutto", async (_, res) => {
  await UserModel.deleteMany({});
  await SessionModel.deleteMany({});
  await VerificationCodeModel.deleteMany({});
  res.status(OK).json({ message: "Tutto cancellato" });
});

export default authRoutes;
