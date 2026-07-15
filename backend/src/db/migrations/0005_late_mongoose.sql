ALTER TABLE `students` MODIFY COLUMN `username` varchar(40);--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `name` varchar(50);--> statement-breakpoint
ALTER TABLE `teachers` MODIFY COLUMN `username` varchar(40);--> statement-breakpoint
ALTER TABLE `teachers` MODIFY COLUMN `name` varchar(50);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance_logs` DROP COLUMN `check_in_time`;--> statement-breakpoint
ALTER TABLE `attendance_logs` DROP COLUMN `check_out_time`;--> statement-breakpoint
ALTER TABLE `attendance_logs` DROP COLUMN `remarks`;