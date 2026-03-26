import gql from "graphql-tag";

export const studentTypeDefs = gql`
    type Student {
        id: ID!
        firstName: String!
        lastName: String!
        email: String!
        phone: String!
        grade: String!
        className: String!
        inviteCode: String!
        classroomId: String!
        teacherId: String!
        exams: [Exam]!
    }

    type Query {
        students: [Student]!
        studentById(id: String): Student! 
    }

    input upsertStudentInput{
        firstName: String!
        lastName: String!
        email: String!
        phone: String!
        inviteCode: String!
    }

    type Mutation{
        upsertStudent(input: upsertStudentInput!): Student 
    }
`
