CREATE TABLE `assignments` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`subject_id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`section_id` varchar(36),
	`due_date` date NOT NULL,
	`max_marks` int NOT NULL,
	`attachment` varchar(500),
	`created_by` varchar(36) NOT NULL,
	`status` varchar(20) DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` varchar(36) NOT NULL,
	`date` date NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`section_id` varchar(36),
	`marked_by` varchar(36) NOT NULL,
	`marking_method` varchar(20) DEFAULT 'manual',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance_logs` (
	`id` varchar(36) NOT NULL,
	`attendance_id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`status` varchar(20) NOT NULL,
	`check_in_time` time,
	`check_out_time` time,
	`remarks` text,
	`marked_at` timestamp DEFAULT (now()),
	CONSTRAINT `attendance_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`action` varchar(50) NOT NULL,
	`entity` varchar(50) NOT NULL,
	`entity_id` varchar(36),
	`old_value` json,
	`new_value` json,
	`ip_address` varchar(50),
	`user_agent` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `book_issues` (
	`id` varchar(36) NOT NULL,
	`book_id` varchar(36) NOT NULL,
	`issued_to` varchar(36) NOT NULL,
	`issued_to_type` varchar(20) NOT NULL,
	`issue_date` date NOT NULL,
	`due_date` date NOT NULL,
	`return_date` date,
	`fine` decimal(10,2) DEFAULT '0',
	`fine_paid` boolean DEFAULT false,
	`status` varchar(20) DEFAULT 'issued',
	`issued_by` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `book_issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_subjects` (
	`id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`subject_id` varchar(36) NOT NULL,
	`teacher_id` varchar(36),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `class_subjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` varchar(36) NOT NULL,
	`name` varchar(50) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`event_type` varchar(50) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date,
	`venue` varchar(200),
	`organizer` varchar(100),
	`is_public` boolean DEFAULT true,
	`status` varchar(20) DEFAULT 'upcoming',
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`exam_type` varchar(20) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`subject_id` varchar(36) NOT NULL,
	`date` date NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`max_marks` int NOT NULL,
	`pass_marks` int NOT NULL,
	`academic_year` varchar(10) NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`status` varchar(20) DEFAULT 'scheduled',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fee_payments` (
	`id` varchar(36) NOT NULL,
	`student_fee_id` varchar(36) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`payment_mode` varchar(20) NOT NULL,
	`transaction_id` varchar(100),
	`receipt_number` varchar(50) NOT NULL,
	`paid_by` varchar(36) NOT NULL,
	`remarks` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fee_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fee_penalties` (
	`id` varchar(36) NOT NULL,
	`student_fee_id` varchar(36) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`days_late` int NOT NULL,
	`penalty_per_day` decimal(12,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fee_penalties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fee_types` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(20) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`frequency` varchar(20) DEFAULT 'monthly',
	`due_day` int DEFAULT 10,
	`penalty_per_day` decimal(12,2) DEFAULT '0',
	`applicable_classes` json,
	`description` text,
	`status` varchar(20) DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fee_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `fee_types_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` varchar(20) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `holidays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `library_books` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`author` varchar(200) NOT NULL,
	`isbn` varchar(20),
	`publisher` varchar(100),
	`category` varchar(50),
	`edition` varchar(20),
	`quantity` int NOT NULL DEFAULT 1,
	`available` int NOT NULL DEFAULT 1,
	`shelf` varchar(20),
	`status` varchar(20) DEFAULT 'available',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `library_books_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marks` (
	`id` varchar(36) NOT NULL,
	`exam_id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`subject_id` varchar(36) NOT NULL,
	`marks_obtained` decimal(10,2) NOT NULL,
	`grade` varchar(5),
	`remarks` text,
	`entered_by` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mcq_answers` (
	`id` varchar(36) NOT NULL,
	`test_id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`question_id` varchar(36) NOT NULL,
	`selected_option` varchar(1) NOT NULL,
	`is_correct` boolean NOT NULL,
	`marks_obtained` int NOT NULL,
	`time_taken` int,
	`answered_at` timestamp DEFAULT (now()),
	CONSTRAINT `mcq_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mcq_questions` (
	`id` varchar(36) NOT NULL,
	`test_id` varchar(36) NOT NULL,
	`question_text` text NOT NULL,
	`option_a` varchar(500) NOT NULL,
	`option_b` varchar(500) NOT NULL,
	`option_c` varchar(500) NOT NULL,
	`option_d` varchar(500) NOT NULL,
	`correct_option` varchar(1) NOT NULL,
	`marks` int NOT NULL DEFAULT 1,
	`explanation` text,
	`order` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `mcq_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mcq_test_results` (
	`id` varchar(36) NOT NULL,
	`test_id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`total_questions` int NOT NULL,
	`correct_answers` int NOT NULL,
	`wrong_answers` int NOT NULL,
	`unattempted` int NOT NULL,
	`marks_obtained` decimal(10,2) NOT NULL,
	`percentage` decimal(5,2) NOT NULL,
	`rank` int,
	`time_taken` int,
	`submitted_at` timestamp DEFAULT (now()),
	CONSTRAINT `mcq_test_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mcq_tests` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`subject_id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`duration` int NOT NULL,
	`total_marks` int NOT NULL,
	`passing_marks` int NOT NULL,
	`negative_marking` decimal(5,2) DEFAULT '0',
	`randomize_questions` boolean DEFAULT false,
	`randomize_options` boolean DEFAULT false,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp NOT NULL,
	`created_by` varchar(36) NOT NULL,
	`status` varchar(20) DEFAULT 'draft',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mcq_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notices` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`target_type` varchar(20) NOT NULL,
	`target_classes` json,
	`attachment` varchar(500),
	`publish_date` date NOT NULL,
	`expiry_date` date,
	`priority` varchar(20) DEFAULT 'normal',
	`created_by` varchar(36) NOT NULL,
	`status` varchar(20) DEFAULT 'draft',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`type` varchar(20) NOT NULL,
	`read` boolean DEFAULT false,
	`link` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `results` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`exam_type` varchar(20) NOT NULL,
	`academic_year` varchar(10) NOT NULL,
	`total_marks` decimal(10,2) NOT NULL,
	`obtained_marks` decimal(10,2) NOT NULL,
	`percentage` decimal(5,2) NOT NULL,
	`cgpa` decimal(5,2),
	`grade` varchar(5) NOT NULL,
	`rank` int,
	`status` varchar(20) DEFAULT 'pass',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` varchar(36) NOT NULL,
	`name` varchar(20) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`capacity` int DEFAULT 30,
	CONSTRAINT `sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` varchar(36) NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`type` varchar(20) DEFAULT 'string',
	`description` text,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `student_fees` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`fee_type_id` varchar(36) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`due_date` date NOT NULL,
	`paid_amount` decimal(12,2) DEFAULT '0',
	`penalty_amount` decimal(12,2) DEFAULT '0',
	`discount` decimal(12,2) DEFAULT '0',
	`scholarship` decimal(12,2) DEFAULT '0',
	`status` varchar(20) DEFAULT 'pending',
	`academic_year` varchar(10) NOT NULL,
	`month` varchar(20),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_fees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`username` varchar(10),
	`email` varchar(255) NOT NULL,
	`name` varchar(10),
	`password` varchar(255) DEFAULT '123456',
	`role` varchar(20) DEFAULT 'student',
	`roll_number` varchar(20) NOT NULL,
	`admission_number` varchar(20),
	`class_id` varchar(36) NOT NULL,
	`section_id` varchar(36),
	`date_of_birth` date,
	`gender` varchar(10),
	`profile_image` varchar(500),
	`blood_group` varchar(5),
	`religion` varchar(50),
	`caste` varchar(50),
	`nationality` varchar(50),
	`aadhar_number` varchar(20),
	`admission_date` date NOT NULL,
	`qrCode` varchar(500),
	`status` varchar(20) DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_email_unique` UNIQUE(`email`),
	CONSTRAINT `students_admission_number_unique` UNIQUE(`admission_number`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(20) NOT NULL,
	`type` varchar(20) DEFAULT 'theory',
	`max_marks` int DEFAULT 100,
	`pass_marks` int DEFAULT 33,
	`status` varchar(20) DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` varchar(36) NOT NULL,
	`assignment_id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`attachment` varchar(500),
	`remarks` text,
	`marks_obtained` decimal(10,2),
	`feedback` text,
	`submitted_at` timestamp DEFAULT (now()),
	`evaluated_at` timestamp,
	`evaluated_by` varchar(36),
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_salaries` (
	`id` varchar(36) NOT NULL,
	`teacher_id` varchar(36) NOT NULL,
	`month` varchar(20) NOT NULL,
	`year` int NOT NULL,
	`basic_salary` decimal(12,2) NOT NULL,
	`allowances` decimal(12,2) DEFAULT '0',
	`deductions` decimal(12,2) DEFAULT '0',
	`net_salary` decimal(12,2) NOT NULL,
	`payment_date` date,
	`payment_mode` varchar(20),
	`transaction_id` varchar(100),
	`status` varchar(20) DEFAULT 'pending',
	`generated_by` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `teacher_salaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`username` varchar(10),
	`email` varchar(255) NOT NULL,
	`name` varchar(10),
	`role` varchar(20) DEFAULT 'teacher',
	`password` varchar(255) DEFAULT '123456',
	`profile_image` varchar(500),
	`employee_id` varchar(20) NOT NULL,
	`qualification` varchar(100),
	`experience` int,
	`specialization` varchar(100),
	`joining_date` date NOT NULL,
	`salary` decimal(12,2),
	`qrCode` varchar(500),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teachers_id` PRIMARY KEY(`id`),
	CONSTRAINT `teachers_email_unique` UNIQUE(`email`),
	CONSTRAINT `teachers_employee_id_unique` UNIQUE(`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `timetable` (
	`id` varchar(36) NOT NULL,
	`class_id` varchar(36) NOT NULL,
	`section_id` varchar(36),
	`subject_id` varchar(36) NOT NULL,
	`teacher_id` varchar(36) NOT NULL,
	`day_of_week` int NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`room` varchar(50),
	`academic_year` varchar(10) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timetable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` varchar(20) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`phone` varchar(20),
	`address` text,
	`profile_image` varchar(500),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_login_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
