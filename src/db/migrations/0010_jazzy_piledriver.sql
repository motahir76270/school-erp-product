ALTER TABLE `students` DROP INDEX `students_user_id_unique`;--> statement-breakpoint
ALTER TABLE `teachers` DROP INDEX `teachers_user_id_unique`;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `userId` varchar(36);--> statement-breakpoint
ALTER TABLE `classes` ADD `userId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `userId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `payment_gateway` ADD `userId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `sections` ADD `userId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `userId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `teachers` ADD `userId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_userId_unique` UNIQUE(`userId`);--> statement-breakpoint
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_userId_unique` UNIQUE(`userId`);--> statement-breakpoint
ALTER TABLE `audit_logs` DROP COLUMN `user_id`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `user_id`;--> statement-breakpoint
ALTER TABLE `notifications` DROP COLUMN `user_id`;--> statement-breakpoint
ALTER TABLE `payment_gateway` DROP COLUMN `user_id`;--> statement-breakpoint
ALTER TABLE `sections` DROP COLUMN `user_id`;--> statement-breakpoint
ALTER TABLE `students` DROP COLUMN `user_id`;--> statement-breakpoint
ALTER TABLE `teachers` DROP COLUMN `user_id`;