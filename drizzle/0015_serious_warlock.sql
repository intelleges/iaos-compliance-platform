CREATE TABLE `cmsContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`languageCode` varchar(10) NOT NULL DEFAULT 'en',
	`text` text NOT NULL,
	`description` text,
	`page` varchar(50),
	`category` varchar(50),
	`enterpriseId` int,
	`version` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `cmsContent_id` PRIMARY KEY(`id`)
);
