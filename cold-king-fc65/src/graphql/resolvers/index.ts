import { examMutation } from "./mutations/exam.mutations";
import { schoolMutation } from "./mutations/school.mutations";
import { studentMutation } from "./mutations/student.mutations";
import { teacherMutation } from "./mutations/teacher.mutations";

export const resolvers = [
	examMutation,
	schoolMutation,
	studentMutation,
	teacherMutation,
];
