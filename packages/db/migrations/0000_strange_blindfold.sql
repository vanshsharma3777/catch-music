CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "album" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"albumId" text NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "album_albumId_unique" UNIQUE("albumId")
);
--> statement-breakpoint
CREATE TABLE "authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "download_url" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"download_config" jsonb,
	"song_id" text
);
--> statement-breakpoint
CREATE TABLE "image_url" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_config" jsonb,
	"song_id" text
);
--> statement-breakpoint
CREATE TABLE "liked_song" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"song_id" text,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "playlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playlistId" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" text,
	CONSTRAINT "playlist_playlistId_unique" UNIQUE("playlistId")
);
--> statement-breakpoint
CREATE TABLE "playlist_song" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"playlist_id" text,
	"song_id" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "singer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"singerId" text NOT NULL,
	"name" text NOT NULL,
	"image_config" jsonb,
	"url" text NOT NULL,
	CONSTRAINT "singer_singerId_unique" UNIQUE("singerId")
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
	"album_id" uuid,
	"singer_id" text,
	CONSTRAINT "song_songId_unique" UNIQUE("songId")
);
--> statement-breakpoint
CREATE TABLE "song_singer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_id" text,
	"singer_id" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"username" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_url" ADD CONSTRAINT "download_url_song_id_song_songId_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("songId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_url" ADD CONSTRAINT "image_url_song_id_song_songId_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("songId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liked_song" ADD CONSTRAINT "liked_song_song_id_song_songId_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("songId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liked_song" ADD CONSTRAINT "liked_song_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_song" ADD CONSTRAINT "playlist_song_playlist_id_playlist_playlistId_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlist"("playlistId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_song" ADD CONSTRAINT "playlist_song_song_id_song_songId_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("songId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song" ADD CONSTRAINT "song_album_id_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song" ADD CONSTRAINT "song_singer_id_singer_singerId_fk" FOREIGN KEY ("singer_id") REFERENCES "public"."singer"("singerId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_singer" ADD CONSTRAINT "song_singer_song_id_song_songId_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("songId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_singer" ADD CONSTRAINT "song_singer_singer_id_singer_singerId_fk" FOREIGN KEY ("singer_id") REFERENCES "public"."singer"("singerId") ON DELETE no action ON UPDATE no action;