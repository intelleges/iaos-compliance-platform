CREATE TABLE `emailVerificationCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`email` varchar(320) NOT NULL,
	`accessCodeId` int NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	CONSTRAINT `emailVerificationCodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerAccessCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`partnerId` int NOT NULL,
	`touchpointId` int,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`used` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	CONSTRAINT `partnerAccessCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `partnerAccessCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `partnerSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionToken` varchar(255) NOT NULL,
	`partnerId` int NOT NULL,
	`accessCodeId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `partnerSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `partnerSessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
