ALTER TABLE `fee_types` ADD `code` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `fee_types` ADD `frequency` varchar(20) DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE `fee_types` ADD `applicable_classes` json;--> statement-breakpoint
ALTER TABLE `fee_types` ADD CONSTRAINT `fee_types_code_unique` UNIQUE(`code`);