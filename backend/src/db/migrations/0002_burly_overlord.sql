ALTER TABLE `class_subjects` RENAME COLUMN `teacher_id` TO `user_id`;--> statement-breakpoint
ALTER TABLE `subjects` ADD `user_id` varchar(40) NOT NULL;