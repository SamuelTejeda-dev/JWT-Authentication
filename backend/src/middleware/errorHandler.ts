import { z } from "zod";
import { ErrorRequestHandler, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import AppError from "../utils/appError";
import { clearAuthCookies, REFRESH_PATH } from "../utils/cookie";

//handleZodError è una funzione prende in input una response e un errore e resituisce una risposta json con il messaggio di errore e lo stato 400

const handleZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));
  return res.status(BAD_REQUEST).json({ message: error.message, errors });
};

//handleAppError è una funzione prende in input una response e un errore e resituisce una risposta json con il messaggio di errore e lo stato 500

const handleAppError = (res: Response, error: AppError) => {
  return res.status(error.statusCode).json({
    message: error.message,
    errorCode: error.errorCode,
  });
};

//errorHandler che verifica se l'errore è un errore di tipo zod o un errore di tipo AppError e gestisce l'errore di conseguenza, altrimenti ritorna un errore 500

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(`PATH: ${req.path}`, error);

  if (req.path === REFRESH_PATH) {
    clearAuthCookies(res);
  }

  if (error instanceof z.ZodError) {
    handleZodError(res, error);
  }

  if (error instanceof AppError) {
    handleAppError(res, error);
  }

  res.status(INTERNAL_SERVER_ERROR).send("Internal server errror");
};

export default errorHandler;
