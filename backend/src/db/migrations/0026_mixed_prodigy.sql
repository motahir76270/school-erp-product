ALTER TABLE `user_permission` ADD `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `user_permission` DROP COLUMN `teacher_id`;