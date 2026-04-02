CREATE TABLE `announced_exam_grades` (
	`id` text PRIMARY KEY NOT NULL,
	`classroomId` text NOT NULL,
	`announcedExamId` text NOT NULL,
	`createdBy` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `announced_exams` (
	`id` text PRIMARY KEY NOT NULL,
	`examId` text NOT NULL,
	`openStatus` integer NOT NULL,
	`scheduledDate` text NOT NULL,
	`startTime` text NOT NULL,
	`createdBy` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `choices` (
	`id` text PRIMARY KEY NOT NULL,
	`questionId` text NOT NULL,
	`text` text NOT NULL,
	`label` text NOT NULL,
	`imageUrl` text,
	`videoUrl` text,
	`isCorrect` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `classrooms` (
	`id` text PRIMARY KEY NOT NULL,
	`teacherId` text NOT NULL,
	`className` text NOT NULL,
	`classCode` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `classrooms_classCode_unique` ON `classrooms` (`classCode`);--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subject` text NOT NULL,
	`description` text,
	`duration` integer NOT NULL,
	`grade` text NOT NULL,
	`fileUrl` text,
	`createdBy` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`question` text NOT NULL,
	`examId` text NOT NULL,
	`indexOnExam` integer NOT NULL,
	`imageUrl` text,
	`videoUrl` text,
	`topic` text,
	`difficulty` text,
	FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `student_exam_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`submissionId` text NOT NULL,
	`questionId` text NOT NULL,
	`selectedChoiceId` text,
	`answerText` text,
	`isCorrect` integer NOT NULL,
	FOREIGN KEY (`submissionId`) REFERENCES `student_exam_submissions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `student_exam_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`studentId` text NOT NULL,
	`examId` text NOT NULL,
	`sessionId` text NOT NULL,
	`deviceId` text NOT NULL,
	`startedAt` integer NOT NULL,
	`lastHeartbeatAt` integer NOT NULL,
	`lastActionAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `student_exam_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`studentId` text NOT NULL,
	`examId` text NOT NULL,
	`startedAt` integer NOT NULL,
	`submittedAt` integer NOT NULL,
	`totalQuestions` integer NOT NULL,
	`correctAnswers` integer NOT NULL,
	`scorePercent` integer NOT NULL,
	`tabSwitchCount` integer DEFAULT 0,
	`reasonForTermination` text,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`grade` text NOT NULL,
	`className` text NOT NULL,
	`inviteCode` text NOT NULL,
	`classroomId` text NOT NULL,
	`teacherId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL
);
