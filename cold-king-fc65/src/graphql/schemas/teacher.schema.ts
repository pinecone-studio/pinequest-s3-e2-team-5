import gql from "graphql-tag";

export const teacherTypeDefs = gql`
    type Teacher {
        id: ID!
        fullName: String!
        email: String!
        phone: String!
        exams: [Exam]!
    }

    type Query {
        teachers: [Teacher]!
        teacherById(id: String): Teacher! 
    }

    input upsertTeacherInput{
        fullName: String!
        email: String!
        phone: String!
    }

    type Mutation {
        upsertTeacher(input: upsertTeacherInput!): Teacher
    }

`