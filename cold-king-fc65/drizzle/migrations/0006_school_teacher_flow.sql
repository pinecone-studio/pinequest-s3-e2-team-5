CREATE TABLE `teacher_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`teacherId` text NOT NULL,
	`teacherName` text NOT NULL,
	`teacherEmail` text NOT NULL,
	`teacherPhone` text NOT NULL,
	`subject` text NOT NULL,
	`schoolId` text NOT NULL,
	`schoolName` text NOT NULL,
	`status` text NOT NULL DEFAULT 'PENDING',
	`createdAt` integer NOT NULL,
	`approvedAt` integer
);

CREATE TABLE `classrooms` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`schoolName` text NOT NULL,
	`teacherId` text NOT NULL,
	`className` text NOT NULL,
	`classCode` text NOT NULL,
	`createdAt` integer NOT NULL
);

CREATE UNIQUE INDEX `classrooms_classCode_unique` ON `classrooms` (`classCode`);
CREATE INDEX `teacher_requests_teacher_idx` ON `teacher_requests` (`teacherId`);
CREATE INDEX `teacher_requests_school_status_idx` ON `teacher_requests` (`schoolId`, `status`);
CREATE INDEX `classrooms_teacher_idx` ON `classrooms` (`teacherId`);
CREATE INDEX `classrooms_school_idx` ON `classrooms` (`schoolId`);

ALTER TABLE `students` ADD `classroomId` text NOT NULL DEFAULT '';
ALTER TABLE `students` ADD `teacherId` text NOT NULL DEFAULT '';
