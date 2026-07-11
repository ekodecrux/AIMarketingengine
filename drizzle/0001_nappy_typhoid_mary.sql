CREATE TABLE `backlinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sourceUrl` varchar(500) NOT NULL,
	`targetUrl` varchar(500),
	`anchorText` varchar(255),
	`domainAuthority` int,
	`status` enum('active','lost','pending') NOT NULL DEFAULT 'active',
	`discoveredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backlinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businessProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`companyName` varchar(255),
	`industry` varchar(255),
	`description` text,
	`targetAudience` text,
	`valueProposition` text,
	`products` text,
	`toneOfVoice` varchar(255),
	`location` varchar(255),
	`extractionSource` enum('website','manual','hybrid') NOT NULL DEFAULT 'manual',
	`sourceUrl` varchar(500),
	`rawExtraction` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`platform` varchar(64),
	`objective` varchar(255),
	`budget` decimal(12,2),
	`spent` decimal(12,2) DEFAULT '0',
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`isRetargeting` int DEFAULT 0,
	`retargetingStrategy` text,
	`status` enum('planned','active','paused','completed') NOT NULL DEFAULT 'planned',
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`websiteUrl` varchar(500),
	`strengths` text,
	`weaknesses` text,
	`positioning` text,
	`channels` text,
	`estimatedTraffic` varchar(64),
	`threatLevel` enum('low','medium','high') DEFAULT 'medium',
	`analysisJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`type` enum('blog','social','linkedin') NOT NULL,
	`platform` varchar(64),
	`title` varchar(500),
	`body` text,
	`hashtags` text,
	`status` enum('draft','scheduled','published') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`aiGenerated` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`keyword` varchar(255) NOT NULL,
	`searchVolume` varchar(64),
	`difficulty` int,
	`intent` enum('informational','navigational','commercial','transactional') DEFAULT 'informational',
	`cpc` varchar(32),
	`opportunity` text,
	`currentRank` int,
	`targetRank` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `keywords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`category` varchar(128) NOT NULL,
	`topicKey` varchar(500) NOT NULL,
	`question` text,
	`content` text NOT NULL,
	`source` enum('ai','knowledge','manual') NOT NULL DEFAULT 'ai',
	`hitCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(64),
	`company` varchar(255),
	`source` varchar(128),
	`stage` enum('new','qualified','proposal','closed_won','closed_lost') NOT NULL DEFAULT 'new',
	`estimatedValue` decimal(12,2),
	`actualRevenue` decimal(12,2),
	`notes` text,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketingPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`objective` text,
	`totalBudget` decimal(12,2),
	`timeframe` varchar(64),
	`planJson` text,
	`status` enum('draft','active','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketingPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`websiteUrl` varchar(500),
	`industry` varchar(255),
	`goal` text,
	`monthlyBudget` decimal(12,2),
	`color` varchar(32) DEFAULT '#6366f1',
	`status` enum('active','paused','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seoAudits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`pageUrl` varchar(500),
	`score` int,
	`recommendationsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seoAudits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`platform` enum('linkedin','facebook','instagram','twitter') NOT NULL,
	`accountName` varchar(255),
	`accessToken` text,
	`apiKey` text,
	`apiSecret` text,
	`status` enum('connected','disconnected','error') NOT NULL DEFAULT 'connected',
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `socialAccounts_id` PRIMARY KEY(`id`)
);
