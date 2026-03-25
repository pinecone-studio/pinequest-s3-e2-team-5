import { createClerkClient } from "@clerk/backend";
import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs } from "./graphql/schemas";
import { resolvers } from "./graphql/resolvers";
 
type WorkerAuthEnv = Env & {
  CLERK_SECRET_KEY?: string;
  CLERK_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
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
 
function getPublishableKey(env: WorkerAuthEnv) {
  return env.CLERK_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}
 
function getAuthorizedParties(env: WorkerAuthEnv) {
  if (!env.CLERK_AUTHORIZED_PARTIES) {
    return undefined;
  }
 
  return env.CLERK_AUTHORIZED_PARTIES.split(",").map((party) => party.trim());
}
 
export async function getRequestAuth(
  request: Request,
  env: WorkerAuthEnv,
): Promise<GraphQLContext["auth"]> {
  const publishableKey = getPublishableKey(env);
 
  if (!env.CLERK_SECRET_KEY || !publishableKey) {
    return {
      userId: null,
      isAuthenticated: false,
    };
  }
 
  const clerk = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey,
  });
 
  // Clerk only needs the auth-related headers here. Build a header-only request
  // so the original GraphQL request body remains untouched for Yoga.
  const authRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
  });
 
  const requestState = await clerk.authenticateRequest(authRequest, {
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey,
    jwtKey: env.CLERK_JWT_KEY,
    authorizedParties: getAuthorizedParties(env),
  });
 
  const auth = requestState.toAuth();
 
  return {
    userId: auth && "userId" in auth ? auth.userId : null,
    isAuthenticated: auth?.isAuthenticated ?? false,
  };
}
 
export const yoga = createYoga<{ env: WorkerAuthEnv }, GraphQLContext>({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  context: async ({ request, env }) => {
    return {
      env,
      auth: await getRequestAuth(request, env),
    };
  },
});
 
 