CREATE TABLE `payment_gateway` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`key` varchar(36) NOT NULL,
	`secret_key` varchar(36) NOT NULL,
	`name` varchar(36) NOT NULL,
	`callback_url` varchar(120),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_gateway_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permission` (
	`id` varchar(36) NOT NULL,
	`teacher_id` varchar(36) NOT NULL,
	`attendance` boolean DEFAULT false,
	`classes` boolean DEFAULT false,
	`exam` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permission_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `parents`;--> statement-breakpoint
ALTER TABLE `students` ADD `username` varchar(10);--> statement-breakpoint
ALTER TABLE `students` ADD `password` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `profile_image` varchar(500);--> statement-breakpoint
ALTER TABLE `students` ADD `qrCode` varchar(500);--> statement-breakpoint
ALTER TABLE `teachers` ADD `username` varchar(10);--> statement-breakpoint
ALTER TABLE `teachers` ADD `password` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `teachers` ADD `profile_image` varchar(500);--> statement-breakpoint
ALTER TABLE `teachers` ADD `qrCode` varchar(500);--> statement-breakpoint
ALTER TABLE `students` DROP COLUMN `qr_code`;--> statement-breakpoint
ALTER TABLE `teachers` DROP COLUMN `qr_code`;