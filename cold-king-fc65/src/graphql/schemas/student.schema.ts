import gql from "graphql-tag";

export const studentTypeDefs = gql`
    type Student {
        id: ID!
        fullName: String!
        email: String!
        phone: String!
        exams: [Exam]!
    }

    type Query {
        students: [Student]!
        studentById(id: String): Student! 
    }

    input upsertStudentInput{
        fullName: String!
        email: String!
        phone: String!
    }

    type Mutation{
        upsertStudent(input: upsertStudentInput!): Student 
    }
`