DROP TABLE `schools`;--> statement-breakpoint
DROP TABLE `teacher_requests`;--> statement-breakpoint
ALTER TABLE `classrooms` DROP COLUMN `schoolId`;--> statement-breakpoint
ALTER TABLE `classrooms` DROP COLUMN `schoolName`;--> statement-breakpoint
ALTER TABLE `students` DROP COLUMN `school`;