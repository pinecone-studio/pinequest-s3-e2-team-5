import { ApolloProvider } from "@apollo/client/react";
import { useAuth } from "@clerk/clerk-expo";
import { useMemo, type ReactNode } from "react";
import { makeApolloClient } from "@/lib/apollo";

export function ApolloAuthedProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const client = useMemo(() => makeApolloClient(() => getToken()), [getToken]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
