import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const missingPersonsTable = pgTable("missing_persons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull().default("unknown"),
  description: text("description"),
  lastSeenLocation: text("last_seen_location").notNull(),
  lastSeenDate: text("last_seen_date").notNull(),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email"),
  status: text("status").notNull().default("active"),
  photoUrl: text("photo_url"),
  faceEmbedding: text("face_embedding"),
  caseNumber: text("case_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMissingPersonSchema = createInsertSchema(missingPersonsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMissingPerson = z.infer<typeof insertMissingPersonSchema>;
export type MissingPerson = typeof missingPersonsTable.$inferSelect;
