'use client';


import { makeClient } from '@/lib/apollo-client';
import { ApolloProvider } from '@apollo/client/react';

const client = makeClient();

export default function ApolloWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
