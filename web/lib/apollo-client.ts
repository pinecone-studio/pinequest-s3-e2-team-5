import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export function makeClient(token?: string) {
  const uri = process.env.NEXT_PUBLIC_GRAPHQL_URL;

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri,
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  });
}
