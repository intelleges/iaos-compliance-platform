ALTER TABLE `emailLogs` ADD `messageId` varchar(255);--> statement-breakpoint
ALTER TABLE `emailLogs` ADD `status` varchar(50);--> statement-breakpoint
ALTER TABLE `emailLogs` ADD `bounceReason` text;--> statement-breakpoint
ALTER TABLE `emailLogs` ADD `bounceClassification` varchar(100);--> statement-breakpoint
ALTER TABLE `emailLogs` ADD `deliveredAt` timestamp;--> statement-breakpoint
ALTER TABLE `emailLogs` ADD `openedAt` timestamp;--> statement-breakpoint
ALTER TABLE `emailLogs` ADD `clickedAt` timestamp;--> statement-breakpoint
ALTER TABLE `emailLogs` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;