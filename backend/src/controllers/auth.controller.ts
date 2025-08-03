import catchErrors from "../utils/catchErrors";
import {
  createAccount,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from "../services/auth.services";
import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import {
  clearAuthCookies,
  getAccessTokenCookieOption,
  getRefreshTokenCookieOption,
  setAuthCookies,
} from "../utils/cookie";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeSchema,
} from "./auth.schemas";
import { verifyToken } from "../utils/jwt";
import SessionModel from "../models/session.model";
import appAssert from "../utils/AppAssert";

export const registerHandler = catchErrors(async (req, res) => {
  //Validazione richiesta

  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  //creazione account
  const { user, accessToken, refreshToken } = await createAccount(request);
  //Ritorna la risposta, i cookie, lo stato e l'utente
  setAuthCookies({ res, accessToken, refreshToken }).status(CREATED).json(user);
});

export const loginHandler = catchErrors(async (req, res) => {
  const request = loginSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  //Prova a fare il login
  const { accessToken, refreshToken } = await loginUser(request);

  //Ritorna la risposta, i cookie, lo stato e un messaggio
  setAuthCookies({ res, accessToken, refreshToken }).status(OK).json({
    message: "Login successful",
  });
});

export const logoutHandler = catchErrors(async (req, res) => {
  const accessToken = req.cookies.accessToken as string | undefined;
  const { payload } = verifyToken(accessToken || "");

  if (payload) {
    await SessionModel.findByIdAndDelete(payload.sessionId);
  }

  clearAuthCookies(res).status(OK).json({ message: "Logout successful" });
});

export const refreshHandler = catchErrors(async (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;

  appAssert(refreshToken, UNAUTHORIZED, "Missing refresh token");

  const { accessToken, newRefreshToken } =
    await refreshUserAccessToken(refreshToken);

  //Se il nuovo refresh token è presente, aggiorna il cookie con il nuovo refresh token
  if (newRefreshToken) {
    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOption());
  }

  res
    .status(OK)
    .cookie("accessToken", accessToken, getAccessTokenCookieOption())
    .json({ message: "Access token refreshed" });
});

export const verifyEmailHandler = catchErrors(async (req, res) => {
  const verificationCode = verificationCodeSchema.parse(req.params.code);

  await verifyEmail(verificationCode);

  res.status(OK).json({ message: "Email verified successfully" });
});

export const sendPasswordResetHandler = catchErrors(async (req, res) => {
  const email = emailSchema.parse(req.body.email);

  await sendPasswordResetEmail(email);

  res.status(OK).json({
    message: "Password reset email sent successfully",
  });
});

export const resetPasswordHandler = catchErrors(async (req, res) => {
  const request = resetPasswordSchema.parse(req.body);

  await resetPassword(request);

  clearAuthCookies(res).status(OK).json({
    message: "Password reset successfully",
  });
});
