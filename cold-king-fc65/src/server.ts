import { createClerkClient } from "@clerk/backend";
import { createSchema, createYoga } from "graphql-yoga";
import { getDb } from "./db/client";
import { classrooms } from "./db/schemas/classroom.schema";
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

function getGradeFromClassName(className: string) {
	const match = className.match(/^(\d{1,2})/);
	return match ? match[1] : className;
}

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

	if (!requestAccessKey || requestAccessKey !== accessKey || !email) {
		return null;
	}

	const existingStudent = await db
		.select({ id: students.id })
		.from(students)
		.where(eq(students.email, email))
		.get();

	if (existingStudent && !inviteCode) {
		return {
			userId: existingStudent.id,
			isAuthenticated: true,
		};
	}

	if (!inviteCode) {
		return null;
	}

	const classroom = await db
		.select({
			id: classrooms.id,
			className: classrooms.className,
			classCode: classrooms.classCode,
			teacherId: classrooms.teacherId,
		})
		.from(classrooms)
		.where(eq(classrooms.classCode, inviteCode))
		.get();

	if (!classroom) {
		return existingStudent
			? {
				userId: existingStudent.id,
				isAuthenticated: true,
			}
			: null;
	}

	const matchedStudent = await db
		.select({ id: students.id })
		.from(students)
		.where(and(eq(students.classroomId, classroom.id), eq(students.email, email)))
		.get();

	if (matchedStudent) {
		return {
			userId: matchedStudent.id,
			isAuthenticated: true,
		};
	}

	// Mobile demo access relies on a classroom code header. If a student row still
	// points at an older classroom, repair the denormalized classroom fields so the
	// rest of the student queries read the correct classroom immediately.
	const staleStudent = existingStudent;

	if (!staleStudent) {
		return null;
	}

	const repairedStudent = await db
		.update(students)
		.set({
			grade: getGradeFromClassName(classroom.className),
			className: classroom.className,
			inviteCode: classroom.classCode,
			classroomId: classroom.id,
			teacherId: classroom.teacherId,
		})
		.where(eq(students.id, staleStudent.id))
		.returning({ id: students.id })
		.get();

	if (!repairedStudent) {
		return null;
	}

	return {
		userId: repairedStudent.id,
		isAuthenticated: true,
	};
}

export async function resolveRequestStudentId(
	request: Request,
	env: WorkerBindings,
	db = getDb(env),
	auth?: GraphQLContext["auth"],
) {
	const demoAuth = await getMobileDemoRequestAuth(request, env, db);

	if (demoAuth?.isAuthenticated && demoAuth.userId) {
		return demoAuth.userId;
	}

	const resolvedAuth = auth ?? (await getResolvedRequestAuth(request, env, db));

	if (!resolvedAuth.isAuthenticated || !resolvedAuth.userId) {
		return null;
	}

	const student = await db
		.select({ id: students.id })
		.from(students)
		.where(eq(students.id, resolvedAuth.userId))
		.get();

	return student?.id ?? null;
}

export async function getResolvedRequestAuth(
	request: Request,
	env: WorkerBindings,
	db = getDb(env),
): Promise<GraphQLContext["auth"]> {
	const requestAuth = await getRequestAuth(request, env);

	if (requestAuth.isAuthenticated) {
		return requestAuth;
	}

	return (await getMobileDemoRequestAuth(request, env, db)) ?? requestAuth;
}

export const yoga = createYoga<{ env: WorkerBindings }, GraphQLContext>({
	schema: createSchema({
		typeDefs,
		resolvers,
	}),
	context: async ({ request, env }) => {
		const db = getDb(env);
		const auth = await getResolvedRequestAuth(request, env, db);

		return {
			env,
			db,
			auth,
		};
	},
});
 
