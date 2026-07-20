CREATE TABLE `teacher_permission` (
	`id` varchar(36) NOT NULL,
	`teacher_id` varchar(36) NOT NULL,
	`attendance` boolean DEFAULT false,
	`subject` boolean DEFAULT false,
	`classes` boolean DEFAULT false,
	`exam` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teacher_permission_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_permission` (
	`id` varchar(36) NOT NULL,
	`teacher_id` varchar(36) NOT NULL,
	`attendance` boolean DEFAULT false,
	`subject` boolean DEFAULT false,
	`classes` boolean DEFAULT false,
	`exam` boolean DEFAULT false,
	`fee` boolean DEFAULT false,
	`users` boolean DEFAULT false,
	`students` boolean DEFAULT false,
	`teachers` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_permission_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `permission`;