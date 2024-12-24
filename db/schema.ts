import { pgTable, text, serial, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Define status as a literal type for better type safety
const CaseStatus = z.enum(["open", "investigating", "resolved"]);
const CaseType = z.enum(["child_missing", "child_labour", "child_harassment"]);

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
  caseType: text("case_type").notNull(),
  imageUrl: text("image_url"),
  reporterId: integer("reporter_id").references(() => users.id).notNull(),
  status: text("status").default("open").notNull(),
  aiCharacteristics: text("ai_characteristics"),
  matchConfidence: text("match_confidence"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Add relations
export const usersRelations = relations(users, ({ many }) => ({
  cases: many(cases)
}));

export const casesRelations = relations(cases, ({ one }) => ({
  reporter: one(users, {
    fields: [cases.reporterId],
    references: [users.id],
  })
}));

// Schema validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertCaseSchema = createInsertSchema(cases).extend({
  status: CaseStatus.optional().default("open"),
  caseType: CaseType
});
export const selectCaseSchema = createSelectSchema(cases).extend({
  status: CaseStatus,
  caseType: CaseType
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;
export type CaseStatusType = z.infer<typeof CaseStatus>;
export type CaseTypeEnum = z.infer<typeof CaseType>;