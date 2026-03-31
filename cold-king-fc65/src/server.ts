import { createClerkClient } from "@clerk/backend";
import { createSchema, createYoga } from "graphql-yoga";
import { getDb } from "./db/client";
import { students } from "./db/schemas/student.schema";
import {
	getAuthorizedParties,
	getMobileDemoAccessKey,
	getPublishableKey,
	type WorkerBindings,
} from "./config/runtime";
import { typeDefs } from "./graphql/schemas";
import { resolvers } from "./graphql/resolvers";
import { and, eq } from "drizzle-orm";

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

async function getMobileDemoRequestAuth(
	request: Request,
	env: WorkerBindings,
	db: ReturnType<typeof getDb>,
): Promise<GraphQLContext["auth"] | null> {
	const accessKey = getMobileDemoAccessKey(env);
	if (!accessKey) {
		return null;
	}

	const requestAccessKey = request.headers.get("x-mobile-demo-key")?.trim();
	const email = request.headers.get("x-mobile-student-email")?.trim().toLowerCase();
	const inviteCode = request.headers.get("x-mobile-student-invite-code")?.trim().toUpperCase();

	if (!requestAccessKey || requestAccessKey !== accessKey || !email || !inviteCode) {
		return null;
	}

	const student = await db
		.select({ id: students.id, email: students.email })
		.from(students)
		.where(eq(students.inviteCode, inviteCode))
		.all();

	const matchedStudent = student.find((entry) => entry.email.trim().toLowerCase() === email);

	if (!matchedStudent) {
		return null;
	}

	return {
		userId: matchedStudent.id,
		isAuthenticated: true,
	};
}

export const yoga = createYoga<{ env: WorkerBindings }, GraphQLContext>({
	schema: createSchema({
		typeDefs,
		resolvers,
	}),
	context: async ({ request, env }) => {
		const db = getDb(env);
		const requestAuth = await getRequestAuth(request, env);
		const auth =
			requestAuth.isAuthenticated
				? requestAuth
				: (await getMobileDemoRequestAuth(request, env, db)) ?? requestAuth;

		return {
			env,
			db,
			auth,
		};
	},
});
 
