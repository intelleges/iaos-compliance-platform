CREATE TABLE `approvalPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enterpriseId` int NOT NULL,
	`groupId` int,
	`protocolId` int,
	`touchpointId` int,
	`grantedBy` int,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvalPermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `partnerQuestionnaires` ADD `reviewerId` int;--> statement-breakpoint
ALTER TABLE `partnerQuestionnaires` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `partnerQuestionnaires` ADD `approvalNotes` text;--> statement-breakpoint
ALTER TABLE `partnerQuestionnaires` ADD `reviewStatus` enum('pending','approved','rejected');