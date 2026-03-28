import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const searchesTable = pgTable("searches", {
  id: serial("id").primaryKey(),
  queryImageUrl: text("query_image_url").notNull(),
  location: text("location"),
  matches: text("matches").notNull().default("[]"),
  totalMatches: integer("total_matches").notNull().default(0),
  searchDurationMs: integer("search_duration_ms").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSearchSchema = createInsertSchema(searchesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searchesTable.$inferSelect;
