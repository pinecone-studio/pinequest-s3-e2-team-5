CREATE TABLE `choices` (
	`id` text PRIMARY KEY NOT NULL,
	`questionId` text NOT NULL,
	`text` text NOT NULL,
	`isCorrect` integer NOT NULL
);
--> statement-breakpoint
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
	`imageUrl` text,
	`videoUrl` text,
	`topic` text,
	`difficulty` text,
	`createdAt` integer
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_students` (
	`id` text PRIMARY KEY NOT NULL,
	`fullName` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`school` text NOT NULL,
	`grade` text NOT NULL,
	`className` text NOT NULL,
	`inviteCode` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_students`("id", "fullName", "email", "phone", "school", "grade", "className", "inviteCode") SELECT "id", "fullName", "email", "phone", "school", "grade", "className", "inviteCode" FROM `students`;--> statement-breakpoint
DROP TABLE `students`;--> statement-breakpoint
ALTER TABLE `__new_students` RENAME TO `students`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`fullName` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`school` text NOT NULL,
	`subject` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_teachers`("id", "fullName", "email", "phone", "school", "subject") SELECT "id", "fullName", "email", "phone", "school", "subject" FROM `teachers`;--> statement-breakpoint
DROP TABLE `teachers`;--> statement-breakpoint
ALTER TABLE `__new_teachers` RENAME TO `teachers`;