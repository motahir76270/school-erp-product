CREATE TABLE `account_hsitory` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`running_balance` decimal(10,2) NOT NULL,
	`payment_mode` varchar(86) NOT NULL,
	`txn_id` varchar(36) NOT NULL,
	`txn_amount` varchar(36) NOT NULL,
	`status` varchar(36) NOT NULL,
	`type` varchar(10) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `account_hsitory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`AccountNumber` varchar(36) NOT NULL,
	`ifsc` varchar(36) NOT NULL,
	`account_Name` varchar(36) NOT NULL,
	`bank_name` varchar(36) NOT NULL,
	`balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
