CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerQuestionnaireId` int NOT NULL,
	`questionId` int,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileType` varchar(100),
	`fileSize` int,
	`documentType` varchar(100),
	`description` text,
	`uploadedBy` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
