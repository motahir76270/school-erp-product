ALTER TABLE `classes` ADD CONSTRAINT `classes_user_id_unique` UNIQUE(`user_id`);--> statement-breakpoint
ALTER TABLE `sections` ADD CONSTRAINT `sections_user_id_unique` UNIQUE(`user_id`);