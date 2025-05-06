import moongoose from "mongoose";

//Questo file serve per aggiungere le proprietà userId e sessionId all'oggetto Request di Express
export interface RequestUserId {
  userId: moongoose.Types.ObjectId;
}

export interface RequestSessionId {
  sessionId: moongoose.Types.ObjectId;
}

declare global {
  namespace Express {
    interface Request {
      userId: moongoose.Types.ObjectId;
      sessionId: moongoose.Types.ObjectId;
    }
  }
}

export {};
