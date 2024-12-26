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
  dateOfBirth: text("date_of_birth"),
  hair: text("hair"),
  eyes: text("eyes"),
  height: integer("height"),
  weight: integer("weight"),
  location: text("location").notNull(),
  description: text("description").notNull(),
  contactInfo: text("contact_info").notNull(),
  caseType: text("case_type", { enum: ["child_missing", "child_labour", "child_harassment"] }).notNull(),
  imageUrl: text("image_url"),
  reporterId: integer("reporter_id").references(() => users.id).notNull(),
  status: text("status", { enum: ["open", "investigating", "resolved"] }).default("open").notNull(),
  aiCharacteristics: text("ai_characteristics"),
  matchConfidence: text("match_confidence"),
  ipfsHash: text("ipfs_hash"),
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
  caseType: CaseType,
  dateOfBirth: z.string().optional(),
  hair: z.string().optional(),
  eyes: z.string().optional(),
  height: z.number().min(0).max(300).optional(), // max height in cm
  weight: z.number().min(0).max(200).optional(), // max weight in kg
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