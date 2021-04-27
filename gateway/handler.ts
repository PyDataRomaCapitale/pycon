import { ApolloServer } from "@pythonit/apollo-server-lambda-with-cors-regex";

import { createContext } from "./context";
import { gateway } from "./gateway";
import { apolloHeadersPlugin } from "./plugins/apollo-headers";

const server = new ApolloServer({
  gateway,
  subscriptions: false,
  introspection: true,
  plugins: [apolloHeadersPlugin(true)],
  context: async ({ event }) => {
    return createContext(event.headers["Cookie"]);
  },
});

const handleManyCookies = (headers: any = {}) => {
  // In Apollo server we can only set 1 set-cookie and nothing else
  // so what we do is that we set in Set-Cookie a serialized JSON Array
  // with all the cookies we want to set
  // When the gateway is running under lambda, we need to de-serialize
  // the cookies and use the specific "multiValueHeaders"
  // key to send multiple set-cookie
  if (headers["set-cookie"]) {
    try {
      const setCookie = headers["set-cookie"];
      headers["set-cookie"] = null;
      const value = JSON.parse(setCookie);
      if (Array.isArray(value)) {
        return {
          headers,
          multiValueHeaders: {
            "Set-Cookie": value,
          },
        };
      }
    } catch (err) {
      console.error(
        'updating cookies to "multiValueHeaders" raised an error',
        err,
      );
      return { headers };
    }
  }

  return { headers };
};

exports.graphqlHandler = async (event: any, context: any) => {
  const serverHandler = server.createHandler({
    cors: {
      credentials: true,
      methods: ["GET", "POST", "OPTIONS", "HEAD"],
      // @ts-ignore
      origin: [/python-italia\.vercel\.app$/],
    },
  });

  try {
    const response: any = await new Promise((resolve, reject) => {
      serverHandler(event, context, (err: any, response: any = {}) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(response);
      });
    });

    const { headers, ...responseData } = response;
    const newHeaders = handleManyCookies(headers);

    return {
      ...responseData,
      ...newHeaders,
    };
  } catch (e) {
    console.error("server handler error:", e);
  }
};
