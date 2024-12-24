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

// Character progression system
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  avatarConfig: jsonb("avatar_config").notNull(), // Stores character appearance
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., 'stranger_danger', 'online_safety'
  requiredLevel: integer("required_level").default(1),
  experiencePoints: integer("experience_points").notNull(),
  iconUrl: text("icon_url"),
  isSecret: boolean("is_secret").default(false)
});

export const characterAchievements = pgTable("character_achievements", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").references(() => characters.id),
  achievementId: integer("achievement_id").references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").default(0), // For tracking partial completion
});

export const categoryProgress = pgTable("category_progress", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").references(() => characters.id),
  category: text("category").notNull(), // Matches safety categories
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  questionsAnswered: integer("questions_answered").default(0),
  correctAnswers: integer("correct_answers").default(0),
  updatedAt: timestamp("updated_at").defaultNow()
});

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
export const insertCharacterSchema = createInsertSchema(characters);
export const selectCharacterSchema = createSelectSchema(characters);
export const insertAchievementSchema = createInsertSchema(achievements);
export const selectAchievementSchema = createSelectSchema(achievements);


// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type CategoryProgress = typeof categoryProgress.$inferSelect;
export type InsertCategoryProgress = typeof categoryProgress.$inferInsert;
export type CaseStatusType = z.infer<typeof CaseStatus>;
export type CaseTypeEnum = z.infer<typeof CaseType>;