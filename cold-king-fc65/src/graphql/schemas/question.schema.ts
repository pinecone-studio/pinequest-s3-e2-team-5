import gql from "graphql-tag";



export const questionTypeDefs = gql`

enum QuestionType {
    mcq,
    open,
    short
}
    scalar DateTime

    type Question{
        id: ID!
        type: QuestionType!
        question: String!

        examId: String!

        imageUrl: String
        videoUrl: String

        topic: String
        difficulty: String
        createdAt: DateTime
    }

    type Query {
        questions: [Question]!
    }

    input createQuestionInput {
        type: QuestionType!
        question: String!
        
        examId: String!

        imageUrl: String
        videoUrl: String

        topic: String
        difficulty: String
        createdAt: Int

        choices: [createChoiceInput!]!
    }

    type Mutation{
        createQuestionWithChoices(input: createQuestionInput!): Question
    }
`