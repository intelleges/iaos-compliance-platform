ALTER TABLE `auditLogs` ADD `ipAddress` varchar(45);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `userAgent` text;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `isCUIAccess` boolean DEFAULT false;