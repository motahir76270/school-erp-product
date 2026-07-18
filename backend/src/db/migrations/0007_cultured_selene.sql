ALTER TABLE `fee_types` DROP INDEX `fee_types_code_unique`;--> statement-breakpoint
ALTER TABLE `fee_types` DROP COLUMN `code`;--> statement-breakpoint
ALTER TABLE `fee_types` DROP COLUMN `frequency`;--> statement-breakpoint
ALTER TABLE `fee_types` DROP COLUMN `applicable_classes`;