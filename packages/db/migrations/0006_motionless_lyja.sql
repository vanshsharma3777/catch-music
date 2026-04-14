ALTER TABLE "song" DROP CONSTRAINT "song_album_id_album_id_fk";
--> statement-breakpoint
ALTER TABLE "song" ALTER COLUMN "album_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "song" ADD CONSTRAINT "song_album_id_album_albumId_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("albumId") ON DELETE no action ON UPDATE no action;