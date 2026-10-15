CREATE TABLE "offline_song_meta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"song_id" text NOT NULL,
	"song_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_playlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"playlist_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "liked_song" DROP CONSTRAINT "liked_song_song_id_song_songId_fk";
--> statement-breakpoint
ALTER TABLE "liked_song" DROP CONSTRAINT "liked_song_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "playlist" DROP CONSTRAINT "playlist_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "playlist_song" DROP CONSTRAINT "playlist_song_song_id_song_songId_fk";
--> statement-breakpoint
ALTER TABLE "playlist_song" DROP CONSTRAINT "playlist_song_playlist_id_playlist_playlistId_fk";
--> statement-breakpoint
ALTER TABLE "liked_song" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "liked_song" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "liked_song" ALTER COLUMN "song_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "liked_song" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "playlist" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "playlist" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "playlist_song" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "playlist_song" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "playlist_song" ALTER COLUMN "song_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "liked_song" ADD COLUMN "song_data" jsonb;--> statement-breakpoint
ALTER TABLE "playlist" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "playlist" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "playlist" ADD COLUMN "is_public" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "playlist_song" ADD COLUMN "position" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "playlist_song" ADD COLUMN "song_data" jsonb;--> statement-breakpoint
ALTER TABLE "offline_song_meta" ADD CONSTRAINT "offline_song_meta_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_playlist" ADD CONSTRAINT "saved_playlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_playlist" ADD CONSTRAINT "saved_playlist_playlist_id_playlist_playlistId_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlist"("playlistId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_offline_song_user_id" ON "offline_song_meta" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_offline_song_unique" ON "offline_song_meta" USING btree ("user_id","song_id");--> statement-breakpoint
CREATE INDEX "idx_saved_playlist_user_id" ON "saved_playlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_playlist_pid" ON "saved_playlist" USING btree ("playlist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_saved_playlist_unique" ON "saved_playlist" USING btree ("user_id","playlist_id");--> statement-breakpoint
ALTER TABLE "liked_song" ADD CONSTRAINT "liked_song_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_song" ADD CONSTRAINT "playlist_song_playlist_id_playlist_playlistId_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlist"("playlistId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_liked_song_user_id" ON "liked_song" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_liked_song_sid" ON "liked_song" USING btree ("song_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_liked_song_unique" ON "liked_song" USING btree ("user_id","song_id");--> statement-breakpoint
CREATE INDEX "idx_playlist_user_id" ON "playlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_playlist_song_pid" ON "playlist_song" USING btree ("playlist_id");--> statement-breakpoint
CREATE INDEX "idx_playlist_song_sid" ON "playlist_song" USING btree ("song_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_playlist_song_unique" ON "playlist_song" USING btree ("playlist_id","song_id");