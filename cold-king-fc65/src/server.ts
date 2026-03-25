import { createClerkClient } from "@clerk/backend";
import { createSchema, createYoga } from "graphql-yoga";
import { getDb } from "./db/client";
import {
	getAuthorizedParties,
	getPublishableKey,
	type WorkerBindings,
} from "./config/runtime";
import { typeDefs } from "./graphql/schemas";
import { resolvers } from "./graphql/resolvers";

export type GraphQLContext = {
	env: WorkerBindings;
	db: ReturnType<typeof getDb>;
	auth: {
		userId: string | null;
		isAuthenticated: boolean;
	};
};

export async function getRequestAuth(
	request: Request,
	env: WorkerBindings,
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

export const yoga = createYoga<{ env: WorkerBindings }, GraphQLContext>({
	schema: createSchema({
		typeDefs,
		resolvers,
	}),
	context: async ({ request, env }) => {
		return {
			env,
			db: getDb(env),
			auth: await getRequestAuth(request, env),
		};
	},
});
 
