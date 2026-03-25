CREATE TABLE `teacher_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`fullName` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`school` text NOT NULL,
	`subject` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`approvedBySchoolId` text DEFAULT '' NOT NULL
);
