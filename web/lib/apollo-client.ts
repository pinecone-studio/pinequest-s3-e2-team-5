import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getCloudflareGraphqlUrl } from "./cloudflare-sync";

export function makeClient(getToken?: () => Promise<string | null>) {
  const uri =
    process.env.NEXT_PUBLIC_GRAPHQL_URL ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_GRAPHQL_URL ||
    getCloudflareGraphqlUrl() ||
    "/graphql";
  const httpLink = new HttpLink({
    uri,
    credentials: "include",
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
