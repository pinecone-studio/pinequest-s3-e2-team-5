ALTER TABLE `students` ADD `school` text NOT NULL DEFAULT '';
ALTER TABLE `students` ADD `grade` text NOT NULL DEFAULT '';
ALTER TABLE `students` ADD `className` text NOT NULL DEFAULT '';
ALTER TABLE `students` ADD `inviteCode` text NOT NULL DEFAULT '';

ALTER TABLE `teachers` ADD `school` text NOT NULL DEFAULT '';
ALTER TABLE `teachers` ADD `subject` text NOT NULL DEFAULT '';
