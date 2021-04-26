import { IS_DEV } from "../config";
import { PastaportoAction } from "./entities";

type Options = {};

export class ClearAuthAction extends PastaportoAction<Options, void> {
  async apply(context: any) {
    context.setCookies.push({
      name: "identity",
      value: "",
      options: {
        httpOnly: true,
        maxAge: -1,
        path: "/",
        sameSite: "none",
        secure: !IS_DEV,
      },
    });

    context.setCookies.push({
      name: "refreshIdentity",
      value: "",
      options: {
        httpOnly: true,
        maxAge: -1,
        path: "/",
        sameSite: "none",
        secure: !IS_DEV,
      },
    });
  }
}
