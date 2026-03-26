import gql from "graphql-tag";


export const classroomTypeDefs = gql`
    type Classroom {
        id: ID!
        teacherId: String!
        className: String!
        classCode: String!
        createdAt: Int!
    }

    type Query{
        classroomsByTeacher(teacherId: String!): [Classroom]!
    }

    input createClassroomInput{
        className: String!
    }

    type Mutation{
        createClassroom(input: createClassroomInput!): Classroom
    }
`