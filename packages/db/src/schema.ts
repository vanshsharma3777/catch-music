import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey,
  uuid,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { AdapterAccount } from "next-auth/adapters";
import { check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const pool = postgres(connectionString, { max: 1 });

export const db = drizzle(pool);

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),

  username: text("username").unique(),
  bio: text("bio"),
  favoriteSingers: jsonb("favorite_singers").$type<{
    id: string;
    name: string;
    image?: string;
    genre?: string;
    categories?: string[];
  }[]>(),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ]
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ]
);

export const song = pgTable("song", {
  id: uuid("id").defaultRandom().primaryKey(),
  songId: text("songId").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  duration: integer("duration").notNull(),
  year: integer("year").notNull(),
  playCount: text("playCount"),
  releaseDate: integer("release_date"),
  language: text("language").notNull(),
  lyrics: text("lyrics"),
  label: text("label").notNull(),
  url: text("url").notNull(),
  hasLyrics: boolean("has_lyrics").default(false),
  isExplicit: boolean("is_explicit").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),

  albumId: text("album_id").references(() => album.albumId),
  singerId: text("singer_id").references(() => singer.singerId),
});

export const singer = pgTable("singer", {
  id: uuid("id").defaultRandom().primaryKey(),
  singerId: text("singerId").notNull().unique(),
  name: text("name").notNull(),
  imageConfig: jsonb("image_config").$type<{
    quality: string;
    url: string;
  }[]>(),
  url: text("url").notNull(),
});

export const downloadUrl = pgTable("download_url", {
  id: uuid("id").defaultRandom().primaryKey(),
  downloadConfig: jsonb("download_config").$type<{
    quality: string;
    url: string;
  }[]>(),
  songId: text("song_id").references(() => song.songId),
});

export const imageUrl = pgTable("image_url", {
  id: uuid("id").defaultRandom().primaryKey(),
  imageConfig: jsonb("image_config").$type<{
    quality: string;
    url: string;
  }[]>(),
  songId: text("song_id").references(() => song.songId),
});

export const album = pgTable("album", {
  id: uuid("id").defaultRandom(),
  albumId: text("albumId").notNull().primaryKey().unique(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  year: integer("year"),
  playCount: integer("play_count"),
});

export const songSinger = pgTable("song_singer", {
  id: uuid("id").defaultRandom().primaryKey(),
  songId: text("song_id").references(() => song.songId),
  singerId: text("singer_id").references(() => singer.singerId),
});

export const playlist = pgTable(
  "playlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playlistId: text("playlistId").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    image: text("image"),
    isPublic: boolean("is_public").default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("idx_playlist_user_id").on(table.userId),
    index("idx_playlist_is_public").on(table.isPublic),
  ]
);

export const playlistSong = pgTable(
  "playlist_song",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    position: integer("position").default(0),
    songData: jsonb("song_data"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
    playListId: text("playlist_id").references(() => playlist.playlistId, { onDelete: "cascade" }),
    songId: text("song_id").notNull(),
  },
  (table) => [
    index("idx_playlist_song_pid").on(table.playListId),
    index("idx_playlist_song_sid").on(table.songId),
    uniqueIndex("idx_playlist_song_unique").on(table.playListId, table.songId),
  ]
);

export const savedPlaylist = pgTable(
  "saved_playlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    playlistId: text("playlist_id").notNull().references(() => playlist.playlistId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_saved_playlist_user_id").on(table.userId),
    index("idx_saved_playlist_pid").on(table.playlistId),
    uniqueIndex("idx_saved_playlist_unique").on(table.userId, table.playlistId),
  ]
);

export const likedSong = pgTable(
  "liked_song",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    songId: text("song_id").notNull(),
    songData: jsonb("song_data"),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_liked_song_user_id").on(table.userId),
    index("idx_liked_song_sid").on(table.songId),
    uniqueIndex("idx_liked_song_unique").on(table.userId, table.songId),
  ]
);

export const offlineSongMeta = pgTable(
  "offline_song_meta",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    songId: text("song_id").notNull(),
    songData: jsonb("song_data"),
    status: text("status").notNull().default("downloaded"),
    sizeBytes: integer("size_bytes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_offline_song_user_id").on(table.userId),
    uniqueIndex("idx_offline_song_unique").on(table.userId, table.songId),
  ]
);

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    message: text("message").notNull(),
    rating: integer("rating"),
    isVisible: boolean("is_visible").default(true).notNull(),
    ipHash: text("ip_hash"),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_feedback_visible_created").on(table.isVisible, table.createdAt),
    index("idx_feedback_user_id").on(table.userId),
        index("idx_feedback_ip_created").on(table.ipHash, table.createdAt),
    check(
      "feedback_rating_range",
      sql`${table.rating} IS NULL OR (${table.rating} BETWEEN 1 AND 5)`
    ),
  ]
);
