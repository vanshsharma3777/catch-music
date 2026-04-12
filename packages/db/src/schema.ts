import {
  boolean,
  timestamp,
  pgTable,
  pgEnum,
  real,
  text,
  primaryKey,
  uuid,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import type { AdapterAccount } from "next-auth/adapters";
import { time } from "drizzle-orm/mysql-core";
import { json } from "drizzle-orm/gel-core";
import { textSpanIsEmpty } from "typescript";
const connectionString = process.env.DATABASE_URL!
const pool = postgres(connectionString, { max: 1 })

export const db = drizzle(pool)

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),

  username: text("username").unique(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
})

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
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

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
)

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
)

export const song = pgTable("song", {
  id: uuid("id").defaultRandom().primaryKey(),
  songId:text("songId").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  duration: integer("duration").notNull(),
  year: integer("year").notNull(),
  playCount: integer("playCount"),
  releaseDate: text("release_data"),
  language: text("language").notNull(),
  lyrics: text("lyrics"),
  label: text("label").notNull(),
  url: text("url").notNull(),
  hasLyrics: boolean("has_lyrics").default(false),
  isExplicit: boolean("is_explicit").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),

  albumId: uuid("album_id").references(() => album.id),
  singerId: text("singer_id").references(() => singer.singerId)
})

export const singer = pgTable("singer", {
  id: uuid("id").defaultRandom().primaryKey(),
  singerId:text("singerId").notNull().unique(),
  name: text("name").notNull(),
  imageConfig: jsonb("image_config").$type<{
    quality: string,
    url: string
  }[]>(),
  url: text("url").notNull()
})

export const downloadUrl = pgTable("download_url", {
  id: uuid("id").defaultRandom().primaryKey(),
  downloadConfig: jsonb("download_config").$type<{
    quality: string,
    url: string
  }[]>(),

  songId: text("song_id").references(() => song.songId)
})

export const imageUrl = pgTable("image_url", {
  id: uuid("id").defaultRandom().primaryKey(),
  imageConfig: jsonb("image_config").$type<{
    quality: string,
    url: string
  }[]>(),

  songId: text("song_id").references(() => song.songId)

})

export const album = pgTable("album", {
  id: uuid("id").defaultRandom().primaryKey(),
  albumId:text("albumId").notNull().unique(),
  url: text("url").notNull(),
  name: text("name").notNull()
})

export const songSinger = pgTable("song_singer", {
  id: uuid("id").defaultRandom().primaryKey(),
  songId: text("song_id").references(() => song.songId),
  singerId: text("singer_id").references(() => singer.singerId)

})
export const playlist = pgTable("playlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  playlistId:text("playlistId").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),

  userId: text("user_id").references(() => users.id)

})

export const playlistSong = pgTable("playlist_song", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),

  playListId: text("playlist_id").references(() => playlist.playlistId),
  songId: text("song_id").references(() => song.songId)


})
export const likedSong = pgTable("liked_song", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),

  songId: text("song_id").references(() => song.songId),
  userId: text("user_id").references(() => users.id)

})