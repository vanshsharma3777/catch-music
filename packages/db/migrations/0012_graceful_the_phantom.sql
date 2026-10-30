CREATE TABLE "song_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_id" text NOT NULL,
	"embedding" vector(384) NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "song_embeddings_song_id_unique" UNIQUE("song_id")
);
