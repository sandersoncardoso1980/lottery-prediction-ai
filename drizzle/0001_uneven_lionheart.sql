CREATE TABLE `lottery_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lotteryType` enum('lotofacil','megasena') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`totalDraws` int NOT NULL,
	`analysisData` text NOT NULL,
	`predictions` text NOT NULL,
	`groqAnalysis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lottery_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `lottery_analyses` ADD CONSTRAINT `lottery_analyses_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;