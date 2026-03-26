import gql from "graphql-tag";

export const studentTypeDefs = gql`
    type Student {
        id: ID!
        fullName: String!
        email: String!
        phone: String!
        school: String!
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
        fullName: String!
        email: String!
        phone: String!
        inviteCode: String!
    }

    type Mutation{
        upsertStudent(input: upsertStudentInput!): Student 
    }
`
