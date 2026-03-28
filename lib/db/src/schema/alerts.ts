import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  missingPersonId: integer("missing_person_id"),
  missingPersonName: text("missing_person_name"),
  type: text("type").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  similarity: real("similarity"),
  location: text("location"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({
  id: true,
  createdAt: true,
  acknowledgedAt: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
