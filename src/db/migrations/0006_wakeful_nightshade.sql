ALTER TABLE `teachers` RENAME COLUMN `status` TO `is_active`;--> statement-breakpoint
ALTER TABLE `teachers` MODIFY COLUMN `is_active` boolean DEFAULT true;