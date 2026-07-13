ALTER TABLE `students` DROP INDEX `students_userId_unique`;--> statement-breakpoint
ALTER TABLE `teachers` DROP INDEX `teachers_userId_unique`;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `user_id` varchar(36);--> statement-breakpoint
ALTER TABLE `classes` ADD `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `payment_gateway` ADD `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `sections` ADD `user_id` varchar(36);--> statement-breakpoint
ALTER TABLE `students` ADD `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `teachers` ADD `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_unique` UNIQUE(`user_id`);--> statement-breakpoint
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_user_id_unique` UNIQUE(`user_id`);--> statement-breakpoint
ALTER TABLE `audit_logs` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `notifications` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `payment_gateway` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `sections` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `students` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `teachers` DROP COLUMN `userId`;