import { createClerkClient } from "@clerk/backend";
import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs } from "./graphql/schemas";
import { resolvers } from "./graphql/resolvers";

type WorkerAuthEnv = Env & {
  CLERK_SECRET_KEY?: string;
  CLERK_PUBLISHABLE_KEY?: string;
  CLERK_JWT_KEY?: string;
  CLERK_AUTHORIZED_PARTIES?: string;
};

export type GraphQLContext = {
  env: WorkerAuthEnv;
  auth: {
    userId: string | null;
    isAuthenticated: boolean;
  };
};

export const yoga = createYoga<{ env: WorkerAuthEnv }, GraphQLContext>({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  context: async ({ request, env }) => {
    if (!env.CLERK_SECRET_KEY || !env.CLERK_PUBLISHABLE_KEY) {
      return {
        env,
        auth: {
          userId: null,
          isAuthenticated: false,
        },
      };
    }

    const clerk = createClerkClient({
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
    });

    const requestState = await clerk.authenticateRequest(request, {
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
      jwtKey: env.CLERK_JWT_KEY,
      authorizedParties: env.CLERK_AUTHORIZED_PARTIES
        ? env.CLERK_AUTHORIZED_PARTIES.split(",").map((party) => party.trim())
        : undefined,
    });

    const auth = requestState.toAuth();

    return {
      env,
      auth: {
        userId: auth && "userId" in auth ? auth.userId : null,
        isAuthenticated: auth?.isAuthenticated ?? false,
      },
    };
  },
});
