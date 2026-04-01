import gql from "graphql-tag";

export const examTypeDefs = gql`
    type Exam {
        id: ID!
        title: String!
        subject: String!
        description: String
        openStatus: Boolean
        duration: Int!
        grade: String!
        createdBy: String!
        fileUrl: String
        classroomName: String
        scheduledDate: String
        startTime: String
        questionCount: Int!
    }

    type AnnouncedExam {
        id: ID!
        examId: String!
        openStatus: Boolean!
        scheduledDate: String!
        startTime: String!
        createdBy: String!
    }

    type AnnouncedExamGrade{
        id: ID!
        classroomId: String!
        announcedExamId: String!
        createdBy: String!
    }

    type TeacherExamChoice {
        id: ID!
        label: String!
        text: String!
        imageUrl: String
        videoUrl: String
        isCorrect: Boolean!
    }


    type TeacherExamQuestion {
        id: ID!
        type: QuestionType!
        question: String!
        imageUrl: String
        videoUrl: String
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

    type TeacherExamQuestionInsight {
        questionId: String!
        order: Int!
        question: String!
        type: QuestionType!
        submissionCount: Int!
        correctCount: Int!
        incorrectCount: Int!
        unansweredCount: Int!
        pendingReviewCount: Int!
        wrongRate: Int
    }

    type TeacherExamAnalytics {
        exam: Exam!
        totalStudents: Int!
        students: [TeacherExamStudentResult!]!
        questionInsights: [TeacherExamQuestionInsight!]!
    }

    type TeacherStudentExamAnswer {
        questionId: String!
        order: Int!
        question: String!
        type: QuestionType!
        submittedText: String
        correctAnswerText: String
        aiExplanation: String
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
        fileUrl: String
    }

    input scheduleExamInput {
        examId: String!
        classroomId: String!
        scheduledDate: String!
        startTime: String!
    }

    input updateExamInput {
        examId: String!
        title: String!
        subject: String!
        description: String
        duration: Int!
        grade: String!
    }

    type Mutation{
        createExam(input: createExamInput!): Exam
        scheduleExam(input: scheduleExamInput!): AnnouncedExam
        updateExam(input: updateExamInput!): Exam
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
