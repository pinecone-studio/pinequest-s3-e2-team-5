import gql from "graphql-tag";

export const examTypeDefs = gql`
    type Exam {
        id: ID!
        name: String!
        students: [Student]!
        teacher: Teacher!
    }

    type Query {
        exams: [Exam]!
    }

    input createExamInput {
        name: String!
    }

    type Mutation{
        createExam(input: createExamInput!): Exam
    }
`