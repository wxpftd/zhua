CREATE TABLE `entries` (
	`date` text PRIMARY KEY NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`decisions` text DEFAULT '' NOT NULL,
	`todos` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hypotheses` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hypothesis_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`hypothesis_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`hypothesis_id`) REFERENCES `hypotheses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weekly_reviews` (
	`week_start` text PRIMARY KEY NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
