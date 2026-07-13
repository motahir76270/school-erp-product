ALTER TABLE `students` ADD `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `teachers` ADD `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_email_unique` UNIQUE(`email`);