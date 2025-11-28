ALTER TABLE `partnerQuestionnaires` ADD `isCUI` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `isCUI` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `touchpoints` ADD `isCUI` boolean DEFAULT false NOT NULL;