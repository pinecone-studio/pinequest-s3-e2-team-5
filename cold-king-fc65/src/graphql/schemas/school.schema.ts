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

    type Query {
        schools: [School]!
    }

    input upsertSchoolInput {
        schoolName: String!
        email: String!
        managerName: String!
        address: String!
        aimag: String!
    }

    type Mutation {
        upsertSchoolProfile(input: upsertSchoolInput!): School
    }
`;
