import gql from "graphql-tag";


export const classroomTypeDefs = gql`

    scalar DateTime

    type Classroom {
        id: ID!
        teacherId: String!
        className: String!
        classCode: String!
        studentCount: Int!
        createdAt: DateTime!
    }

    type TeacherClassroomStudentSummary {
        id: ID!
        studentId: String!
        name: String!
        score: String
        percent: Int
        durationMinutes: Int
        submittedAt: Float
        hasIntegrityViolation: Boolean!
        integrityReason: SubmissionIntegrityReason
        integrityMessage: String
    }

    type TeacherClassroomDetail {
        classroom: Classroom!
        examCount: Int!
        averagePercent: Int!
        students: [TeacherClassroomStudentSummary!]!
    }

    type Query{
        classroomsByTeacher: [Classroom]!
        teacherClassroomDetail(classroomId: String!): TeacherClassroomDetail!
    }

    input createClassroomInput{
        className: String!
    }

    input updateClassroomInput{
        classroomId: String!
        className: String!
    }

    type Mutation{
        createClassroom(input: createClassroomInput!): Classroom
        updateClassroom(input: updateClassroomInput!): Classroom
        deleteClassroom(classroomId: String!): Classroom
    }
`
