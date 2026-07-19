CREATE TABLE `schools` (
	`id` varchar(36) NOT NULL,
	`school_name` varchar(255) NOT NULL,
	`school_code` varchar(50),
	`affiliation` varchar(100),
	`affiliation_no` varchar(100),
	`director_name` varchar(20),
	`principal_name` varchar(255),
	`website` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schools_id` PRIMARY KEY(`id`),
	CONSTRAINT `schools_school_code_unique` UNIQUE(`school_code`)
);
