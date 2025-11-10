import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User configuration for automatic news posting to X (Twitter)
 * Stores X API credentials and posting preferences
 */
export const userConfigs = mysqlTable("user_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  xApiKey: text("xApiKey").notNull(),
  xApiSecret: text("xApiSecret").notNull(),
  xAccessToken: text("xAccessToken").notNull(),
  xAccessTokenSecret: text("xAccessTokenSecret").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  scheduleInterval: int("scheduleInterval").default(300).notNull(), // in minutes (300 = 5 hours)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserConfig = typeof userConfigs.$inferSelect;
export type InsertUserConfig = typeof userConfigs.$inferInsert;

/**
 * Log of posted tweets
 * Records all tweets posted to X (Twitter) with source information
 */
export const postedTweets = mysqlTable("posted_tweets", {
  id: int("id").autoincrement().primaryKey(),
  configId: int("configId").notNull(),
  tweetText: text("tweetText").notNull(),
  imageUrl: text("imageUrl"),
  sourceNewsUrl: text("sourceNewsUrl").notNull(),
  sourceTitle: text("sourceTitle"),
  sourceMedia: varchar("sourceMedia", { length: 100 }),
  postedAt: timestamp("postedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostedTweet = typeof postedTweets.$inferSelect;
export type InsertPostedTweet = typeof postedTweets.$inferInsert;

/**
 * Relations between tables
 */
export const userConfigsRelations = relations(userConfigs, ({ one, many }) => ({
  user: one(users, {
    fields: [userConfigs.userId],
    references: [users.id],
  }),
  tweets: many(postedTweets),
}));

export const postedTweetsRelations = relations(postedTweets, ({ one }) => ({
  config: one(userConfigs, {
    fields: [postedTweets.configId],
    references: [userConfigs.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  configs: many(userConfigs),
}));