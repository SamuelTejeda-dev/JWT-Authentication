import { z } from "zod";
import { NOT_FOUND, OK } from "../constants/http";
import SessionModel, { SessionDocument } from "../models/session.model";
import appAssert from "../utils/AppAssert";
import catchErrors from "../utils/catchErrors";

export const getSessionHandler = catchErrors(async (req, res) => {
  const session = await SessionModel.find(
    {
      userId: req.userId,
      expiresAt: { $gt: new Date() },
    },
    {
      _id: 1, //1 significa che vogliamo includere il campo, 0 significa che non lo vogliamo includere
      userAgent: 1,
      createdAt: 1,
    },
    {
      sort: { createdAt: -1 }, // ordina per data di creazione decrescente
    }
  );

  appAssert(session, NOT_FOUND, "Session not found");

  res.status(OK).json(
    session.map((session: SessionDocument) => ({
      ...session.toObject(),
      ...(session.id === req.sessionId && { isCurrent: true }), //se l'id della sessione è uguale a quello della richiesta, allora è la sessione corrente
    }))
  );
});

export const deleteSessionHandler = catchErrors(async (req, res) => {
  const sessionId = z.string().length(24).parse(req.params.id);
  const deleted = await SessionModel.findByIdAndDelete({
    _id: sessionId,
    userId: req.userId,
  });
  appAssert(deleted, NOT_FOUND, "Session not found");
  res.status(OK).json({
    message: "Session deleted",
  });
});
