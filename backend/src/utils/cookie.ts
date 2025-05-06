import { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, thirtyDaysFormNow } from "./date";

//questa funzione serve per settare i cookie di accesso e refresh token, in modo da non doverli settare in ogni singola route

const secure = process.env.NODE_ENV !== "development";
export const REFRESH_PATH = "/auth/refresh";

const defaults: CookieOptions = {
  sameSite: "strict",
  httpOnly: true,
  secure,
};

export const getAccessTokenCookieOption = (): CookieOptions => ({
  ...defaults,
  expires: fifteenMinutesFromNow(),
});

export const getRefreshTokenCookieOption = (): CookieOptions => ({
  ...defaults,
  expires: thirtyDaysFormNow(),
  path: REFRESH_PATH,
});

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) => {
  return res
    .cookie("accessToken", accessToken, getAccessTokenCookieOption())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOption());
};

export const clearAuthCookies = (res: Response) => {
  return res
    .clearCookie("accessToken")
    .clearCookie("refreshToken", { path: REFRESH_PATH });
};
