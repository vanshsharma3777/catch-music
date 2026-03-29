CREATE TABLE "album" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"albumId" text NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "download_url" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"download_config" jsonb,
	"song_id" uuid
);
--> statement-breakpoint
CREATE TABLE "image_url" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_config" jsonb,
	"song_id" uuid
);
--> statement-breakpoint
CREATE TABLE "liked_song" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"song_id" uuid,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "playlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playlistId" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "playlist_song" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"playlist_id" uuid,
	"song_id" uuid
);
--> statement-breakpoint
CREATE TABLE "singer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"singerId" text NOT NULL,
	"name" text NOT NULL,
	"image_config" jsonb,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "song" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"songId" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"duration" integer NOT NULL,
	"year" integer NOT NULL,
	"playCount" integer,
	"release_data" text,
	"language" text NOT NULL,
	"lyrics" text,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"has_lyrics" boolean DEFAULT false,
	"is_explicit" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"album_id" uuid
);
--> statement-breakpoint
CREATE TABLE "song_singer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_id" uuid,
	"singer_id" uuid
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "download_url" ADD CONSTRAINT "download_url_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_url" ADD CONSTRAINT "image_url_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liked_song" ADD CONSTRAINT "liked_song_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liked_song" ADD CONSTRAINT "liked_song_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_song" ADD CONSTRAINT "playlist_song_playlist_id_playlist_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlist"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_song" ADD CONSTRAINT "playlist_song_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song" ADD CONSTRAINT "song_album_id_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_singer" ADD CONSTRAINT "song_singer_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_singer" ADD CONSTRAINT "song_singer_singer_id_singer_id_fk" FOREIGN KEY ("singer_id") REFERENCES "public"."singer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");--> statement-breakpoint
DROP TYPE "public"."difficulty";--> statement-breakpoint
DROP TYPE "public"."game_type";--> statement-breakpoint
DROP TYPE "public"."question_status";--> statement-breakpoint
DROP TYPE "public"."question_type";--> statement-breakpoint
DROP TYPE "public"."status";