CREATE TABLE `posted_tweets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` int NOT NULL,
	`tweetText` text NOT NULL,
	`imageUrl` text,
	`sourceNewsUrl` text NOT NULL,
	`sourceTitle` text,
	`sourceMedia` varchar(100),
	`postedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `posted_tweets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`xApiKey` text NOT NULL,
	`xApiSecret` text NOT NULL,
	`xAccessToken` text NOT NULL,
	`xAccessTokenSecret` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_configs_id` PRIMARY KEY(`id`)
);
