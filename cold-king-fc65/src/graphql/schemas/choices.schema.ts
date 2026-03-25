import gql from "graphql-tag";



export const choiceTypeDefs = gql`
    type Choice{
        id: ID!
        questionId: String!
        text: String!
        label: String!
        isCorrect: Boolean!
    }

    type Query{
        choicesOnQuestion(questionId: String!): [Choice]!
    }

    input createChoiceInput{
        questionId: String!
        text: String!
        label: String!
        isCorrect: Boolean!
    }
`