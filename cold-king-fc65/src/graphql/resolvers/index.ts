import { classroomMutation } from "./mutations/classroom.mutations";
import { examMutation } from "./mutations/exam.mutations";
import { studentMutation } from "./mutations/student.mutations";
import { teacherMutation } from "./mutations/teacher.mutations";
import { classRoomQuery } from "./queries/classroom.queries";
import { examQuery } from "./queries/exam.queries";

export const resolvers = [
	examQuery,
	examMutation,
	studentMutation,
	teacherMutation,
	classroomMutation,
	classRoomQuery
];
