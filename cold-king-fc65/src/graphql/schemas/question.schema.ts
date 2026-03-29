import gql from "graphql-tag";



export const questionTypeDefs = gql`

enum QuestionType {
    mcq,
    open,
    short
}

    type Question{
        id: ID!
        type: QuestionType!
        question: String!

        examId: String!
        indexOnExam: Int!

        imageUrl: String
        videoUrl: String

        topic: String
        difficulty: String
    }

    type Query {
        questions: [Question]!
    }

    input createQuestionInput {
        type: QuestionType!
        question: String!
        
        examId: String!
        indexOnExam: Int!

        imageUrl: String
        videoUrl: String

        topic: String
        difficulty: String

        choices: [createChoiceInput!]!
    }

    input updateQuestionInput {
        questionId: String!
        type: QuestionType!
        question: String!

        examId: String!
        indexOnExam: Int!

        imageUrl: String
        videoUrl: String

        topic: String
        difficulty: String

        choices: [createChoiceInput!]!
    }

    type Mutation{
        createQuestionWithChoices(input: createQuestionInput!): Question
        updateQuestionWithChoices(input: updateQuestionInput!): Question
    }
`
