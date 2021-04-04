import jwt from "jsonwebtoken";

import { PASTAPORTO_ACTION_SECRET } from "../config";
import { AuthAction } from "./auth-action";
import { Action } from "./entities";

type DecodedToken = {
  action: Lowercase<keyof typeof Action>;
  payload: { [key: string]: string };
};

export const getPastaportoActionFromToken = (token: string) => {
  const decodedToken = jwt.verify(
    token,
    PASTAPORTO_ACTION_SECRET as string,
  ) as DecodedToken;

  const actionName = decodedToken.action.toUpperCase() as keyof typeof Action;
  const action = Action[actionName];

  switch (action) {
    case Action.AUTH:
      return new AuthAction(decodedToken.payload);
    default:
      throw new Error(`Unsupported pastaporto action: ${decodedToken.action}`);
  }
};
