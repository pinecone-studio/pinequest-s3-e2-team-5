import gql from "graphql-tag";

export const schoolTypeDefs = gql`
    type School {
        id: ID!
        schoolName: String!
        email: String!
        managerName: String!
        address: String!
        aimag: String!
    }

    type TeacherRequest {
        id: ID!
        teacherId: String!
        teacherName: String!
        teacherEmail: String!
        teacherPhone: String!
        subject: String!
        schoolId: String!
        schoolName: String!
        status: String!
        createdAt: Float!
        approvedAt: Float
    }

    type Classroom {
        id: ID!
        schoolId: String!
        schoolName: String!
        teacherId: String!
        className: String!
        classCode: String!
        createdAt: Float!
    }

    input upsertSchoolInput {
        schoolName: String!
        email: String!
        managerName: String!
        address: String!
        aimag: String!
    }

    input requestTeacherApprovalInput {
        schoolId: ID!
    }

    input approveTeacherRequestInput {
        requestId: ID!
    }

    input createClassroomInput {
        schoolId: ID!
        className: String!
    }

    type Query {
        schools: [School!]!
        mySchoolProfile: School
        myTeacherRequests: [TeacherRequest!]!
        teacherRequestsForMySchool(status: String): [TeacherRequest!]!
        myClassrooms: [Classroom!]!
    }

    type Mutation {
        upsertSchoolProfile(input: upsertSchoolInput!): School
        requestTeacherApproval(input: requestTeacherApprovalInput!): TeacherRequest
        approveTeacherRequest(input: approveTeacherRequestInput!): TeacherRequest
        createClassroom(input: createClassroomInput!): Classroom
    }
`;
