import { and, eq, sql } from "drizzle-orm";
import { classrooms } from "../../../db/schemas/classroom.schema";
import { schools } from "../../../db/schemas/school.schema";
import { teacherRequests } from "../../../db/schemas/teacher-request.schema";
import { teachers } from "../../../db/schemas/teacher.schema";
import type { GraphQLContext } from "../../../server";

function requireAuth(context: GraphQLContext) {
	if (!context.auth.userId || !context.auth.isAuthenticated) {
		throw new Error("Unauthorized");
	}

	return context.auth.userId;
}

async function requireSchoolManager(context: GraphQLContext) {
	const userId = requireAuth(context);
	const school = await context.db
		.select()
		.from(schools)
		.where(eq(schools.id, userId))
		.get();

	if (!school) {
		throw new Error("Only school accounts can do this action.");
	}

	return school;
}

function createClassCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let result = "";
	for (let index = 0; index < 8; index += 1) {
		const randomIndex = Math.floor(Math.random() * alphabet.length);
		result += alphabet[randomIndex];
	}
	return result;
}

async function generateUniqueClassCode(context: GraphQLContext) {
	for (let attempts = 0; attempts < 8; attempts += 1) {
		const code = createClassCode();
		const exists = await context.db
			.select({ id: classrooms.id })
			.from(classrooms)
			.where(eq(classrooms.classCode, code))
			.get();

		if (!exists) {
			return code;
		}
	}

	throw new Error("Could not generate unique class code. Try again.");
}

export const schoolMutation = {
	Query: {
		schools: async (_: unknown, __: unknown, context: GraphQLContext) => {
			return context.db.select().from(schools).all();
		},
		mySchoolProfile: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const userId = requireAuth(context);
			return context.db
				.select()
				.from(schools)
				.where(eq(schools.id, userId))
				.get();
		},
		myTeacherRequests: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const userId = requireAuth(context);
			return context.db
				.select()
				.from(teacherRequests)
				.where(eq(teacherRequests.teacherId, userId))
				.all();
		},
		teacherRequestsForMySchool: async (
			_: unknown,
			args: { status?: string | null },
			context: GraphQLContext,
		) => {
			const userId = requireAuth(context);
			const school = await context.db
				.select({ id: schools.id })
				.from(schools)
				.where(eq(schools.id, userId))
				.get();
			if (!school) {
				return [];
			}
			const normalizedStatus = args.status?.trim().toUpperCase();

			if (!normalizedStatus) {
				return context.db
					.select()
					.from(teacherRequests)
					.where(eq(teacherRequests.schoolId, school.id))
					.all();
			}

			return context.db
				.select()
				.from(teacherRequests)
				.where(
					and(
						eq(teacherRequests.schoolId, school.id),
						sql`upper(${teacherRequests.status}) = ${normalizedStatus}`,
					),
				)
				.all();
		},
		myClassrooms: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const userId = requireAuth(context);
			return context.db
				.select()
				.from(classrooms)
				.where(eq(classrooms.teacherId, userId))
				.all();
		},
	},
	Mutation: {
		upsertSchoolProfile: async (
			_: unknown,
			args: {
				input: {
					schoolName: string;
					email: string;
					managerName: string;
					address: string;
					aimag: string;
				};
			},
			context: GraphQLContext,
		) => {
			const userId = requireAuth(context);
			const values = {
				schoolName: args.input.schoolName,
				email: args.input.email,
				managerName: args.input.managerName,
				address: args.input.address,
				aimag: args.input.aimag,
			};

			const existing = await context.db
				.select({ id: schools.id })
				.from(schools)
				.where(eq(schools.id, userId))
				.get();

			if (existing) {
				return context.db
					.update(schools)
					.set(values)
					.where(eq(schools.id, userId))
					.returning()
					.get();
			}

			return context.db
				.insert(schools)
				.values({
					id: userId,
					...values,
				})
					.returning()
					.get();
		},
		requestTeacherApproval: async (
			_: unknown,
			args: { input: { schoolId: string } },
			context: GraphQLContext,
		) => {
			const teacherId = requireAuth(context);
			const school = await context.db
				.select()
				.from(schools)
				.where(eq(schools.id, args.input.schoolId))
				.get();

			if (!school) {
				throw new Error("School not found.");
			}

			const teacher = await context.db
				.select()
				.from(teachers)
				.where(eq(teachers.id, teacherId))
				.get();

			if (!teacher) {
				throw new Error("Teacher profile missing. Please complete teacher sign up first.");
			}

			const existingRequest = await context.db
				.select()
				.from(teacherRequests)
				.where(
					and(
						eq(teacherRequests.teacherId, teacherId),
						eq(teacherRequests.schoolId, school.id),
					),
				)
				.get();
			const existingStatus = existingRequest?.status?.toUpperCase();

			if (existingStatus === "PENDING") {
				throw new Error("You already have a pending request for this school.");
			}

			if (existingStatus === "APPROVED") {
				return existingRequest;
			}

			const now = Date.now();
			const values = {
				teacherName: teacher.fullName,
				teacherEmail: teacher.email,
				teacherPhone: teacher.phone,
				subject: teacher.subject,
				schoolName: school.schoolName,
				status: "PENDING" as const,
				createdAt: now,
				approvedAt: null,
			};

			if (existingRequest) {
				return context.db
					.update(teacherRequests)
					.set(values)
					.where(eq(teacherRequests.id, existingRequest.id))
					.returning()
					.get();
			}

			const requestId = crypto.randomUUID();

			try {
				return await context.db
					.insert(teacherRequests)
					.values({
						id: requestId,
						teacherId,
						schoolId: school.id,
						...values,
					})
					.returning()
					.get();
			} catch {
				// Backward compatibility: some D1 environments still keep legacy
				// NOT NULL columns (fullName/email/phone/school) in teacher_requests.
				await context.db.run(sql`
					INSERT INTO teacher_requests
						(id, teacherId, teacherName, teacherEmail, teacherPhone, subject, schoolId, schoolName, status, createdAt, approvedAt, fullName, email, phone, school)
					VALUES
						(${requestId}, ${teacherId}, ${values.teacherName}, ${values.teacherEmail}, ${values.teacherPhone}, ${values.subject}, ${school.id}, ${values.schoolName}, ${values.status}, ${values.createdAt}, ${values.approvedAt}, ${values.teacherName}, ${values.teacherEmail}, ${values.teacherPhone}, ${values.schoolName})
				`);

				return context.db
					.select()
					.from(teacherRequests)
					.where(eq(teacherRequests.id, requestId))
					.get();
			}
		},
		approveTeacherRequest: async (
			_: unknown,
			args: { input: { requestId: string } },
			context: GraphQLContext,
		) => {
			const school = await requireSchoolManager(context);
			const request = await context.db
				.select()
				.from(teacherRequests)
				.where(
					and(
						eq(teacherRequests.id, args.input.requestId),
						eq(teacherRequests.schoolId, school.id),
					),
				)
				.get();

			if (!request) {
				throw new Error("Request not found.");
			}

			if (request.status === "APPROVED") {
				return request;
			}

			return context.db
				.update(teacherRequests)
				.set({
					status: "APPROVED",
					approvedAt: Date.now(),
				})
				.where(eq(teacherRequests.id, request.id))
				.returning()
				.get();
		},
		createClassroom: async (
			_: unknown,
			args: { input: { schoolId: string; className: string } },
			context: GraphQLContext,
		) => {
			const teacherId = requireAuth(context);
			const className = args.input.className.trim().toUpperCase();
			if (!className) {
				throw new Error("Class name is required.");
			}

			const school = await context.db
				.select()
				.from(schools)
				.where(eq(schools.id, args.input.schoolId))
				.get();

			if (!school) {
				throw new Error("School not found.");
			}

			const approvedRequest = await context.db
				.select()
				.from(teacherRequests)
				.where(
					and(
						eq(teacherRequests.teacherId, teacherId),
						eq(teacherRequests.schoolId, school.id),
						sql`upper(${teacherRequests.status}) = 'APPROVED'`,
					),
				)
				.get();

			if (!approvedRequest) {
				throw new Error("You must be approved by this school before creating a class.");
			}

			const classCode = await generateUniqueClassCode(context);
			const classId = crypto.randomUUID();
			const createdAt = Date.now();

			try {
				return await context.db
					.insert(classrooms)
					.values({
						id: classId,
						schoolId: school.id,
						schoolName: school.schoolName,
						teacherId,
						className,
						classCode,
						createdAt,
					})
					.returning()
					.get();
			} catch {
				// Backward compatibility: some D1 environments still keep legacy
				// NOT NULL "school" column in classrooms.
				await context.db.run(sql`
					INSERT INTO classrooms
						(id, schoolId, schoolName, teacherId, className, classCode, createdAt, school)
					VALUES
						(${classId}, ${school.id}, ${school.schoolName}, ${teacherId}, ${className}, ${classCode}, ${createdAt}, ${school.schoolName})
				`);

				return context.db
					.select()
					.from(classrooms)
					.where(eq(classrooms.id, classId))
					.get();
			}
		},
	},
};
