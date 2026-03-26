import gql from "graphql-tag";


export const classroomTypeDefs = gql`

    scalar DateTime

    type Classroom {
        id: ID!
        teacherId: String!
        className: String!
        classCode: String!
        createdAt: DateTime!
    }

    type Query{
        classroomsByTeacher: [Classroom]!
    }

    input createClassroomInput{
        className: String!
    }

    type Mutation{
        createClassroom(input: createClassroomInput!): Classroom
    }
`