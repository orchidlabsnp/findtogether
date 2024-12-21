import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  address: text("address").unique().notNull(),
  name: text("name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow()
});

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  childName: text("child_name").notNull(),
  age: integer("age").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  contactInfo: text("contact_info").notNull(),
  caseType: text("case_type"),
  imageUrl: text("image_url"),
  reporterId: integer("reporter_id").references(() => users.id),
  status: text("status").default("open"),
  aiCharacteristics: text("ai_characteristics"),
  matchConfidence: text("match_confidence"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertCaseSchema = createInsertSchema(cases);
export const selectCaseSchema = createSelectSchema(cases);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;
