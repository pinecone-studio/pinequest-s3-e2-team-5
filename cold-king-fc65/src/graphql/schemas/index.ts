import { examTypeDefs } from "./exam.schema";
import { schoolTypeDefs } from "./school.schema";
import { studentTypeDefs } from "./student.schema";
import { teacherTypeDefs } from "./teacher.schema";

export const typeDefs = [
    studentTypeDefs, teacherTypeDefs, schoolTypeDefs, examTypeDefs
]
