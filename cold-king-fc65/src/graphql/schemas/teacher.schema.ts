import gql from "graphql-tag";

export const teacherTypeDefs = gql`
    type Teacher {
        id: ID!
        fullName: String!
        email: String!
        phone: String!
        school: String!
        subject: String!
        exams: [Exam]!
    }

    type TeacherRequest {
        id: ID!
        fullName: String!
        email: String!
        phone: String!
        school: String!
        subject: String!
        status: String!
        approvedBySchoolId: String!
    }

    type Classroom {
        id: ID!
        teacherId: String!
        school: String!
        className: String!
        classCode: String!
    }

    type Query {
        teachers: [Teacher]!
        teacherById(id: String): Teacher! 
        teacherRequestsForMySchool(status: String, schoolName: String): [TeacherRequest]!
        myTeacherRequest: TeacherRequest
        myClassrooms: [Classroom]!
    }

    input upsertTeacherInput{
        fullName: String!
        email: String!
        phone: String!
        school: String!
        subject: String!
    }

    input requestTeacherAccessInput {
        fullName: String!
        email: String!
        phone: String!
        school: String!
        subject: String!
    }

    input approveTeacherRequestInput {
        teacherUserId: String!
        schoolName: String
    }

    input createClassroomInput {
        className: String!
    }

    type Mutation {
        upsertTeacher(input: upsertTeacherInput!): Teacher
        requestTeacherAccess(input: requestTeacherAccessInput!): TeacherRequest
        approveTeacherRequest(input: approveTeacherRequestInput!): Teacher
        createClassroom(input: createClassroomInput!): Classroom
    }

`
