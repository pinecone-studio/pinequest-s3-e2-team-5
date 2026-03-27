import gql from "graphql-tag";

export const examTypeDefs = gql`
    type Exam {
        id: ID!
        title: String!
        subject: String!
        description: String!
        openStatus: Boolean!
        duration: Int!
        grade: String!
        createdBy: String!
    }

    type Query {
        exams: [Exam]!
        examById(examId: String!): Exam!
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
        updateExam(input: updateExamInput!): Exam
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
