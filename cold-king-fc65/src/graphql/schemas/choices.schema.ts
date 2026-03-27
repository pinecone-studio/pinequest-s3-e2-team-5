import gql from "graphql-tag";



export const choiceTypeDefs = gql`
    type Choice{
        id: ID!
        questionId: String!
        text: String!
        label: String!
        imageUrl: String
        videoUrl: String
        isCorrect: Boolean!
    }

    type Query{
        choicesOnQuestion(questionId: String!): [Choice]!
    }

    input createChoiceInput{
        id: String!
        text: String!
        label: String!
        imageUrl: String
        videoUrl: String
        isCorrect: Boolean!
    }
`
