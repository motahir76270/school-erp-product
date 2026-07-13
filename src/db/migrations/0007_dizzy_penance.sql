ALTER TABLE `classes` ADD `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `sections` ADD `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `numeric_value`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `class_teacher_id`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `classes` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `sections` DROP COLUMN `teacher_id`;--> statement-breakpoint
ALTER TABLE `sections` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `sections` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `sections` DROP COLUMN `updated_at`;