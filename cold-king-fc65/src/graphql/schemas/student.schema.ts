import gql from 'graphql-tag';

export const studentTypeDefs = gql`
	type Student {
		id: ID!
		firstName: String!
		lastName: String!
		email: String!
		phone: String!
		grade: String!
		className: String!
		inviteCode: String!
		classroomId: String!
		teacherId: String!
		exams: [Exam]!
	}

	type StudentAvailableExam {
		id: ID!
		examId: String!
		title: String!
		subject: String!
		description: String
		grade: String!
		scheduledDate: String
		startTime: String
		duration: Int!
		questionCount: Int!
		isLocked: Boolean!
		minutesUntilStart: Int!
		startsAtMs: Float
	}

	type StudentExamChoice {
		id: ID!
		label: String!
		text: String!
	}

	type StudentExamQuestion {
		id: ID!
		type: QuestionType!
		question: String!
		order: Int!
		imageUrl: String
		videoUrl: String
		topic: String
		difficulty: String
		choices: [StudentExamChoice!]!
	}

	type StudentExamDetail {
		id: ID!
		title: String!
		subject: String!
		description: String
		grade: String!
		scheduledDate: String
		startTime: String
		duration: Int!
		questionCount: Int!
		questions: [StudentExamQuestion!]!
	}

	type StudentExamSubmission {
		id: ID!
		examId: String!
		title: String!
		subject: String!
		grade: String!
		scheduledDate: String
		startTime: String
		duration: Int!
		questionCount: Int!
		correctAnswers: Int!
		scorePercent: Int!
		tabSwitchCount: Int!
		submittedAt: Float!
	}

	type StudentExamAnswerReview {
		questionId: String!
		order: Int!
		question: String!
		type: QuestionType!
		answerText: String
		correctAnswerText: String
		aiExplanation: String
		selectedChoiceId: String
		correctChoiceId: String
		isCorrect: Boolean
		choices: [StudentExamChoice!]!
	}

	enum SubmissionIntegrityReason {
		BACKGROUND
		SESSION_REPLACED
		NO_FACE
		MULTIPLE_FACES
	}

	type StudentExamSubmissionDetail {
		id: ID!
		examId: String!
		title: String!
		subject: String!
		grade: String!
		scheduledDate: String
		startTime: String
		duration: Int!
		questionCount: Int!
		correctAnswers: Int!
		scorePercent: Int!
		tabSwitchCount: Int!
		submittedAt: Float!
		answers: [StudentExamAnswerReview!]!
	}

	type Query {
		students: [Student]!
		studentById(id: String): Student!
		availableExamsForStudent: [StudentAvailableExam!]!
		scheduledExamsForStudent: [StudentAvailableExam!]!
		studentExamDetail(examId: String!): StudentExamDetail!
		myExamSubmissions: [StudentExamSubmission!]!
		studentExamSubmissionDetail(submissionId: String!): StudentExamSubmissionDetail!
	}

	input upsertStudentInput {
		firstName: String!
		lastName: String!
		email: String!
		phone: String!
		inviteCode: String!
	}

	input ChangeStudentClassroomInput {
		inviteCode: String!
	}

	input StudentExamAnswerInput {
		questionId: String!
		selectedChoiceId: String
		answerText: String
	}

	input SubmissionIntegrityIncidentInput {
		reason: SubmissionIntegrityReason!
	}

	input SubmitStudentExamInput {
		examId: String!
		startedAt: Float
		tabSwitchCount: Int
		answers: [StudentExamAnswerInput!]!
		integrityIncident: SubmissionIntegrityIncidentInput
	}

	type Mutation {
		upsertStudent(input: upsertStudentInput!): Student
		changeStudentClassroom(input: ChangeStudentClassroomInput!): Student!
		submitStudentExam(input: SubmitStudentExamInput!): StudentExamSubmission!
	}
`;
