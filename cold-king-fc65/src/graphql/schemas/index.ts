import { choiceTypeDefs } from "./choices.schema";
import { classroomTypeDefs } from "./classroom.chema";
import { examTypeDefs } from "./exam.schema";
import { questionTypeDefs } from "./question.schema";
import { studentTypeDefs } from "./student.schema";
import { teacherTypeDefs } from "./teacher.schema";

export const typeDefs = [
    studentTypeDefs, teacherTypeDefs, examTypeDefs, classroomTypeDefs, questionTypeDefs, choiceTypeDefs
]
