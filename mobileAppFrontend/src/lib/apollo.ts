import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { env } from "@/lib/env";

export function makeApolloClient(getToken?: () => Promise<string | null>) {
  const httpLink = new HttpLink({
    uri: env.graphqlUrl,
  });

  const authLink = setContext(async (_, { headers }) => {
    const token = getToken ? await getToken() : null;

    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink),
  });
}
