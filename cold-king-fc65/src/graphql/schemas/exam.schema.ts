import gql from "graphql-tag";

export const examTypeDefs = gql`
    type Exam {
        id: ID!
        title: String!
        subject: String!
        description: String
        openStatus: Boolean!
        duration: Int!
        grade: String!
        createdBy: String!
        classroomId: String
        classroomName: String
        scheduledDate: String
        startTime: String
        questionCount: Int!
    }

    type TeacherExamChoice {
        id: ID!
        label: String!
        text: String!
        isCorrect: Boolean!
    }

    type TeacherExamQuestion {
        id: ID!
        type: QuestionType!
        prompt: String!
        order: Int!
        correctChoiceId: String
        choices: [TeacherExamChoice!]!
    }

    type TeacherExamDetail {
        exam: Exam!
        questions: [TeacherExamQuestion!]!
    }

    type TeacherExamStudentResult {
        id: ID!
        studentId: String!
        name: String!
        section: String!
        score: String!
        percent: Int!
        submittedAt: Float!
        durationMinutes: Int!
    }

    type TeacherExamAnalytics {
        exam: Exam!
        totalStudents: Int!
        students: [TeacherExamStudentResult!]!
    }

    type TeacherStudentExamAnswer {
        questionId: String!
        order: Int!
        prompt: String!
        type: QuestionType!
        submittedText: String
        selectedChoiceId: String
        correctChoiceId: String
        isCorrect: Boolean
        choices: [TeacherExamChoice!]!
    }

    type TeacherStudentExamSubmissionDetail {
        exam: Exam!
        studentId: String!
        studentName: String!
        section: String!
        score: String!
        percent: Int!
        durationMinutes: Int!
        startedAt: Float!
        submittedAt: Float!
        answers: [TeacherStudentExamAnswer!]!
    }

    type Query {
        exams: [Exam]!
        examById(examId: String!): Exam!
        myExams: [Exam!]!
        teacherScheduledExams: [Exam!]!
        teacherExamDetail(examId: String!): TeacherExamDetail!
        teacherExamAnalytics(examId: String!): TeacherExamAnalytics!
        teacherStudentSubmissionDetail(
            examId: String!
            studentId: String!
        ): TeacherStudentExamSubmissionDetail!
    }

    input createExamInput {
        title: String!
        subject: String!
        description: String
        duration: Int!
        grade: String!
        createdBy: String
        openStatus: Boolean
    }

    input scheduleExamInput {
        examId: String!
        classroomId: String!
        scheduledDate: String!
        startTime: String!
    }

    type Mutation{
        createExam(input: createExamInput!): Exam
        scheduleExam(input: scheduleExamInput!): Exam
        deleteExam(examId: String!): Exam
    }
`
// id: text().primaryKey().notNull(),

// title: text().notNull(),

// subject: text().notNull(),
// description: text(),

// openStatus: int({ mode: "boolean" }).notNull().default(false),

// duration: int().notNull(), //minutes

// grade: text().notNull(),

// createdBy: text().notNull()
