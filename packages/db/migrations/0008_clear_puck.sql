ALTER TABLE "offline_song_meta" ADD COLUMN "status" text DEFAULT 'downloaded' NOT NULL;--> statement-breakpoint
ALTER TABLE "offline_song_meta" ADD COLUMN "size_bytes" integer;--> statement-breakpoint
ALTER TABLE "offline_song_meta" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_playlist_is_public" ON "playlist" USING btree ("is_public");