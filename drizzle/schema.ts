import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
 * Lottery Analysis table - stores analysis results and predictions
 */
export const lotteryAnalyses = mysqlTable("lottery_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  lotteryType: mysqlEnum("lotteryType", ["lotofacil", "megasena"]).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  totalDraws: int("totalDraws").notNull(),
  analysisData: text("analysisData").notNull(), // JSON string with statistics
  predictions: text("predictions").notNull(), // JSON string with AI predictions
  groqAnalysis: text("groqAnalysis"), // Full Groq analysis response
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LotteryAnalysis = typeof lotteryAnalyses.$inferSelect;
export type InsertLotteryAnalysis = typeof lotteryAnalyses.$inferInsert;