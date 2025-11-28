ALTER TABLE `questions` MODIFY COLUMN `accessLevel` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `questions` ADD `page` int;--> statement-breakpoint
ALTER TABLE `questions` ADD `sectionCode` varchar(50);--> statement-breakpoint
ALTER TABLE `questions` ADD `minLength` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `questions` ADD `titleLength` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `questions` ADD `hasSkipLogic` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `skipLogicTrigger` varchar(50);--> statement-breakpoint
ALTER TABLE `questions` ADD `skipLogicTarget` int;--> statement-breakpoint
ALTER TABLE `questions` ADD `commentMessage` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `uploadMessage` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `calendarMessage` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `yesScore` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `questions` ADD `noScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `questions` ADD `naScore` int DEFAULT -1;--> statement-breakpoint
ALTER TABLE `questions` ADD `otherScore` int DEFAULT -1;--> statement-breakpoint
ALTER TABLE `questions` ADD `qWeight` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `questions` ADD `hasSpinoff` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `spinoffId` varchar(100);--> statement-breakpoint
ALTER TABLE `questions` ADD `hasEmailAlert` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `emailAlertList` text;