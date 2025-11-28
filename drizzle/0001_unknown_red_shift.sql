CREATE TABLE `countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`code` varchar(50),
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	CONSTRAINT `countries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255),
	`timestamp` timestamp,
	`event` varchar(50) NOT NULL,
	`reason` text,
	`url` varchar(500),
	`category` varchar(500),
	`accessCode` varchar(50),
	`enterpriseId` int,
	`loadGroup` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` text,
	`text` text,
	`footer1` text,
	`footer2` text,
	`sendDateCalcFactor` int NOT NULL,
	`sendDateSet` date,
	`mailType` int NOT NULL,
	`touchpointQuestionnaireId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enterprises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` varchar(100) NOT NULL,
	`companyName` varchar(50),
	`instanceName` varchar(50),
	`userMax` int,
	`partnerMax` int,
	`subscriptionType` int,
	`subscriptionStatus` int,
	`licenseStartDate` date,
	`licenseEndDate` date,
	`logo` text,
	`applicationPath` varchar(500),
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enterprises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enterpriseId` int,
	`groupCollectionId` int NOT NULL,
	`groupType` int,
	`name` varchar(50),
	`description` varchar(100),
	`email` varchar(50),
	`authorId` int,
	`stateId` int,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	`dateCreated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerQuestionnaires` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`touchpointQuestionnaireId` int NOT NULL,
	`accessCode` varchar(50) NOT NULL,
	`invitedBy` int NOT NULL,
	`invitedDate` date NOT NULL,
	`dueDate` date,
	`completedDate` date,
	`status` int NOT NULL,
	`progress` int,
	`score` int,
	`priority` int,
	`zcode` varchar(500),
	`pdfUrl` text,
	`docFolderAddress` varchar(500),
	`loadGroup` varchar(8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnerQuestionnaires_id` PRIMARY KEY(`id`),
	CONSTRAINT `partnerQuestionnaires_accessCode_unique` UNIQUE(`accessCode`)
);
--> statement-breakpoint
CREATE TABLE `partnerStatuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` varchar(50) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partnerStatuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50),
	`alias` varchar(50),
	`description` varchar(50) NOT NULL,
	`partnerClass` int,
	`enterpriseId` int,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnerTypes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enterpriseId` int NOT NULL,
	`internalId` varchar(255),
	`name` varchar(255),
	`dunsNumber` varchar(255),
	`federalId` varchar(255),
	`cageCode` varchar(50),
	`address1` varchar(255),
	`address2` text,
	`city` varchar(255),
	`state` varchar(50),
	`province` varchar(50),
	`zipcode` varchar(200),
	`countryCode` varchar(10),
	`firstName` varchar(255),
	`lastName` varchar(255),
	`title` varchar(255),
	`email` varchar(255),
	`phone` varchar(100),
	`fax` varchar(100),
	`status` int,
	`partnerTypeId` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocols` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enterpriseId` int,
	`name` varchar(50),
	`description` varchar(100),
	`abbreviation` varchar(50),
	`background` varchar(500),
	`purpose` varchar(500),
	`summary` varchar(500),
	`adminId` int,
	`sponsorId` int,
	`startDate` timestamp,
	`endDate` timestamp,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `protocols_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questionnaireResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerQuestionnaireId` int NOT NULL,
	`questionId` int NOT NULL,
	`responseId` int,
	`comment` text,
	`value` int,
	`score` int,
	`uploadedFileUrl` text,
	`uploadedFileType` varchar(500),
	`actionDate` timestamp,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questionnaireResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questionnaires` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enterpriseId` int,
	`title` text,
	`description` text,
	`footer` varchar(100),
	`locked` boolean,
	`multiLanguage` boolean,
	`levelType` int,
	`personId` int NOT NULL,
	`partnerTypeId` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questionnaires_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` text,
	`name` text,
	`title` text NOT NULL,
	`tag` text,
	`responseType` int,
	`required` boolean,
	`weight` int,
	`skipLogicAnswer` int,
	`skipLogicJump` text,
	`commentRequired` boolean,
	`commentBoxTxt` text,
	`commentUploadTxt` varchar(500),
	`commentType` int,
	`emailAlert` boolean,
	`accessLevel` int,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` text NOT NULL,
	`zcode` varchar(2),
	`enterpriseId` int,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` varchar(50),
	`accessLevel` int,
	`enterpriseId` int,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stateCode` varchar(10) NOT NULL,
	`name` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	CONSTRAINT `states_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `touchpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`protocolId` int,
	`title` varchar(50),
	`description` text,
	`abbreviation` varchar(50),
	`purpose` text,
	`personId` int,
	`sponsorId` int,
	`adminId` int,
	`target` int,
	`automaticReminder` boolean,
	`startDate` timestamp,
	`endDate` timestamp,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `touchpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userGroups` (
	`userId` int NOT NULL,
	`groupId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE TABLE `userRoles` (
	`userId` int NOT NULL,
	`roleId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','enterprise_owner','compliance_officer','procurement_team','supplier') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `enterpriseId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `firstName` varchar(200);--> statement-breakpoint
ALTER TABLE `users` ADD `lastName` varchar(200);--> statement-breakpoint
ALTER TABLE `users` ADD `title` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `internalId` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `active` boolean DEFAULT true NOT NULL;