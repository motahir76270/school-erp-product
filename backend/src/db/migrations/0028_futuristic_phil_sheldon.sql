CREATE TABLE `teacher_attendance` (
	`id` varchar(36) NOT NULL,
	`date` date NOT NULL,
	`marked_by` varchar(36) NOT NULL,
	`marking_method` varchar(20) DEFAULT 'manual',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `teacher_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_attendance_logs` (
	`id` varchar(36) NOT NULL,
	`attendance_id` varchar(36) NOT NULL,
	`teacher_id` varchar(36) NOT NULL,
	`status` varchar(20) NOT NULL,
	`marked_at` timestamp DEFAULT (now()),
	CONSTRAINT `teacher_attendance_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
RENAME TABLE `attendance` TO `student_attendance`;--> statement-breakpoint
RENAME TABLE `attendance_logs` TO `student_attendance_logs`;--> statement-breakpoint
ALTER TABLE `student_attendance` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `student_attendance_logs` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `student_attendance` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `student_attendance_logs` ADD PRIMARY KEY(`id`);