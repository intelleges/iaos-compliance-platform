CREATE TABLE `groupCollections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enterpriseId` int,
	`name` varchar(100) NOT NULL,
	`description` text,
	`parentId` int,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groupCollections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerGroups` (
	`partnerId` int NOT NULL,
	`groupId` int NOT NULL,
	`assignedBy` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE TABLE `touchpointQuestionnaires` (
	`id` int AUTO_INCREMENT NOT NULL,
	`touchpointId` int NOT NULL,
	`questionnaireId` int NOT NULL,
	`partnerTypeId` int NOT NULL,
	`groupId` int,
	`dueDate` date,
	`autoReminder` boolean DEFAULT true,
	`reminderDays` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	CONSTRAINT `touchpointQuestionnaires_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `questions` ADD `hintText` text;