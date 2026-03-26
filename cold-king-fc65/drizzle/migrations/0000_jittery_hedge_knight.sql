CREATE TABLE `choices` (
	`id` text PRIMARY KEY NOT NULL,
	`questionId` text NOT NULL,
	`text` text NOT NULL,
	`label` text NOT NULL,
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
	`openStatus` integer DEFAULT false NOT NULL,
	`duration` integer NOT NULL,
	`grade` text NOT NULL,
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
