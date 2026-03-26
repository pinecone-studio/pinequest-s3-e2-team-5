ALTER TABLE `students` ADD `firstName` text NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `lastName` text NOT NULL;--> statement-breakpoint
ALTER TABLE `students` DROP COLUMN `fullName`;--> statement-breakpoint
ALTER TABLE `teachers` ADD `firstName` text NOT NULL;--> statement-breakpoint
ALTER TABLE `teachers` ADD `lastName` text NOT NULL;--> statement-breakpoint
ALTER TABLE `teachers` DROP COLUMN `fullName`;--> statement-breakpoint
ALTER TABLE `teachers` DROP COLUMN `school`;--> statement-breakpoint
ALTER TABLE `teachers` DROP COLUMN `subject`;