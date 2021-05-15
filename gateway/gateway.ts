import {
  ApolloGateway,
  LocalGraphQLDataSource,
  RemoteGraphQLDataSource,
} from "@apollo/gateway";

import { getPastaportoActionFromToken } from "./actions";
import { IS_DEV } from "./config";
import { schema as logoutSchema } from "./internal-services/logout";
import { Pastaporto } from "./pastaporto/entities";
import { getServices } from "./services";

const PASTAPORTO_X_HEADER = "x-pastaporto";
const PASTAPORTO_ACTION_X_HEADER = "x-pastaporto-action";

class ServiceRemoteGraphQLDataSource extends RemoteGraphQLDataSource {
  // @ts-ignore
  async willSendRequest({ request, context }) {
    const pastaporto: Pastaporto = context.pastaporto;
    if (pastaporto) {
      request!.http!.headers.set(PASTAPORTO_X_HEADER, pastaporto.sign());
    }
  }

  // @ts-ignore
  didReceiveResponse({ response, request, context }) {
    const headers = response.http!.headers;
    const pastaportoAction = headers.get(PASTAPORTO_ACTION_X_HEADER);

    if (pastaportoAction) {
      context.pastaportoAction = getPastaportoActionFromToken(pastaportoAction);
    }

    return response;
  }

  // @ts-ignore
  async process({ request, context }) {
    const response = await super.process({
      request,
      context,
    });

    if (context.pastaportoAction) {
      await context.pastaportoAction.apply(context);
    }

    return response;
  }
}

export const gateway = new ApolloGateway({
  serviceList: getServices(),
  experimental_pollInterval: IS_DEV ? 5000 : 0,
  buildService({ name, url }) {
    if (name === "logout") {
      return new LocalGraphQLDataSource(logoutSchema);
    }

    return new ServiceRemoteGraphQLDataSource({
      url,
    });
  },
});
