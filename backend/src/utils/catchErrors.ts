import { NextFunction, Request, Response } from "express";

//questa funzione è un middleware che gestisce gli errori delle route asincrone, in modo da non dover gestire gli errori in ogni singola route

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

const catchErrors =
  (controller: AsyncController): AsyncController =>
  async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };

export default catchErrors;
