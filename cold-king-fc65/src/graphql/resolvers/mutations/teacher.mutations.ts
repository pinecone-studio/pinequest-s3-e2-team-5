import { and, eq } from "drizzle-orm";
import { findMockSchoolByName } from "../../../config/mock-schools";
import { classrooms } from "../../../db/schemas/classroom.schema";
import { schools } from "../../../db/schemas/school.schema";
import { teacherRequests } from "../../../db/schemas/teacher-request.schema";
import { teachers } from "../../../db/schemas/teacher.schema";
import type { GraphQLContext } from "../../../server";

function generateClassCodeCandidate() {
	return `CLS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export const teacherMutation = {
	Query: {
		teacherRequestsForMySchool: async (
			_: unknown,
			args: {
				status?: string;
				schoolName?: string;
			},
			context: GraphQLContext,
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const managerUserId = context.auth.userId;
			const managerSchool = await context.db
				.select({
					schoolName: schools.schoolName,
				})
				.from(schools)
				.where(eq(schools.id, managerUserId))
				.get();

			const fallbackSchoolName = args.schoolName?.trim();
			const scopedSchoolName = managerSchool?.schoolName ?? fallbackSchoolName;

			if (!scopedSchoolName) {
				return [];
			}

			const normalizedStatus = args.status?.trim().toLowerCase();

			if (normalizedStatus) {
				return context.db
					.select()
					.from(teacherRequests)
					.where(
						and(
							eq(teacherRequests.school, scopedSchoolName),
							eq(teacherRequests.status, normalizedStatus),
						),
					)
					.all();
			}

			return context.db
				.select()
				.from(teacherRequests)
				.where(eq(teacherRequests.school, scopedSchoolName))
				.all();
		},
		myTeacherRequest: async (
			_: unknown,
			__args: unknown,
			context: GraphQLContext,
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			return context.db
				.select()
				.from(teacherRequests)
				.where(eq(teacherRequests.id, context.auth.userId))
				.get();
		},
		myClassrooms: async (_: unknown, __args: unknown, context: GraphQLContext) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			return context.db
				.select()
				.from(classrooms)
				.where(eq(classrooms.teacherId, context.auth.userId))
				.all();
		},
	},
	Mutation: {
		upsertTeacher: async (
			_: unknown,
			args: {
				input: {
					fullName: string;
					email: string;
					phone: string;
					school: string;
					subject: string;
				};
			},
			context: GraphQLContext,
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const userId = context.auth.userId;
			const values = {
				fullName: args.input.fullName,
				email: args.input.email,
				phone: args.input.phone,
				school: args.input.school,
				subject: args.input.subject,
			};

			const existing = await context.db
				.select({ id: teachers.id })
				.from(teachers)
				.where(eq(teachers.id, userId))
				.get();

			if (existing) {
				return context.db
					.update(teachers)
					.set(values)
					.where(eq(teachers.id, userId))
					.returning()
					.get();
			}

			return context.db
				.insert(teachers)
				.values({
					id: userId,
					...values,
				})
				.returning()
				.get();
		},
		requestTeacherAccess: async (
			_: unknown,
			args: {
				input: {
					fullName: string;
					email: string;
					phone: string;
					school: string;
					subject: string;
				};
			},
			context: GraphQLContext,
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const userId = context.auth.userId;

			const existingTeacher = await context.db
				.select({
					id: teachers.id,
					fullName: teachers.fullName,
					email: teachers.email,
					phone: teachers.phone,
					school: teachers.school,
					subject: teachers.subject,
				})
				.from(teachers)
				.where(eq(teachers.id, userId))
				.get();

			if (existingTeacher) {
				const existingRequest = await context.db
					.select()
					.from(teacherRequests)
					.where(eq(teacherRequests.id, userId))
					.get();

				if (existingRequest) {
					return existingRequest;
				}

				const approvedBySchool = await context.db
					.select({ id: schools.id })
					.from(schools)
					.where(eq(schools.schoolName, existingTeacher.school))
					.get();

				return context.db
					.insert(teacherRequests)
					.values({
						id: existingTeacher.id,
						fullName: existingTeacher.fullName,
						email: existingTeacher.email,
						phone: existingTeacher.phone,
						school: existingTeacher.school,
						subject: existingTeacher.subject,
						status: "approved",
						approvedBySchoolId: approvedBySchool?.id ?? "",
					})
					.returning()
					.get();
			}

			const schoolName = args.input.school.trim();
			const school = await context.db
				.select({ id: schools.id })
				.from(schools)
				.where(eq(schools.schoolName, schoolName))
				.get();

			const mockSchool = !school ? findMockSchoolByName(schoolName) : null;

			if (!school && !mockSchool) {
				throw new Error("School not found. Ask your school manager to register first.");
			}

			const existingRequest = await context.db
				.select()
				.from(teacherRequests)
				.where(eq(teacherRequests.id, userId))
				.get();

			if (existingRequest?.status === "approved") {
				return existingRequest;
			}

			const values = {
				fullName: args.input.fullName.trim(),
				email: args.input.email.trim(),
				phone: args.input.phone.trim(),
				school: schoolName,
				subject: args.input.subject.trim(),
				status: "pending",
				approvedBySchoolId: "",
			};

			if (existingRequest) {
				return context.db
					.update(teacherRequests)
					.set(values)
					.where(eq(teacherRequests.id, userId))
					.returning()
					.get();
			}

			return context.db
				.insert(teacherRequests)
				.values({
					id: userId,
					...values,
				})
				.returning()
				.get();
		},
		approveTeacherRequest: async (
			_: unknown,
			args: {
				input: {
					teacherUserId: string;
					schoolName?: string;
				};
			},
			context: GraphQLContext,
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const managerUserId = context.auth.userId;
			const managerSchool = await context.db
				.select({
					id: schools.id,
					schoolName: schools.schoolName,
				})
				.from(schools)
				.where(eq(schools.id, managerUserId))
				.get();

			const fallbackSchoolName = args.input.schoolName?.trim();
			const scopedSchoolName = managerSchool?.schoolName ?? fallbackSchoolName;

			if (!scopedSchoolName) {
				throw new Error("School profile is not ready. Please sync school profile first.");
			}

			const teacherRequest = await context.db
				.select()
				.from(teacherRequests)
				.where(
					and(
						eq(teacherRequests.id, args.input.teacherUserId),
						eq(teacherRequests.status, "pending"),
					),
				)
				.get();

			if (!teacherRequest) {
				throw new Error("Pending teacher request not found.");
			}

			if (teacherRequest.school !== scopedSchoolName) {
				throw new Error("You can only approve teachers for your own school.");
			}

			const teacherValues = {
				fullName: teacherRequest.fullName,
				email: teacherRequest.email,
				phone: teacherRequest.phone,
				school: teacherRequest.school,
				subject: teacherRequest.subject,
			};

			const existingTeacher = await context.db
				.select({ id: teachers.id })
				.from(teachers)
				.where(eq(teachers.id, teacherRequest.id))
				.get();

			const approvedTeacher = existingTeacher
				? await context.db
						.update(teachers)
						.set(teacherValues)
						.where(eq(teachers.id, teacherRequest.id))
						.returning()
						.get()
				: await context.db
						.insert(teachers)
						.values({
							id: teacherRequest.id,
							...teacherValues,
						})
						.returning()
						.get();

			await context.db
				.update(teacherRequests)
				.set({
					status: "approved",
					approvedBySchoolId: managerSchool?.id ?? "",
				})
				.where(eq(teacherRequests.id, teacherRequest.id))
				.run();

			return approvedTeacher;
		},
		createClassroom: async (
			_: unknown,
			args: {
				input: {
					className: string;
				};
			},
			context: GraphQLContext,
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const userId = context.auth.userId;
			const teacherProfile = await context.db
				.select({
					id: teachers.id,
					school: teachers.school,
				})
				.from(teachers)
				.where(eq(teachers.id, userId))
				.get();

			if (!teacherProfile) {
				throw new Error("Teacher is not approved yet.");
			}

			const normalizedClassName = args.input.className.trim();
			if (!normalizedClassName) {
				throw new Error("Class name is required.");
			}

			for (let attempt = 0; attempt < 10; attempt += 1) {
				const classCode = generateClassCodeCandidate();
				const existingClassroom = await context.db
					.select({ id: classrooms.id })
					.from(classrooms)
					.where(eq(classrooms.classCode, classCode))
					.get();

				if (existingClassroom) {
					continue;
				}

				return context.db
					.insert(classrooms)
					.values({
						id: crypto.randomUUID(),
						teacherId: userId,
						school: teacherProfile.school,
						className: normalizedClassName,
						classCode,
					})
					.returning()
					.get();
			}

			throw new Error("Failed to generate unique class code. Try again.");
		},
	},
};
