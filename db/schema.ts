import { pgTable, text, serial, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
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
  ipfsHash: text("ipfs_hash"),
  reporterId: integer("reporter_id").references(() => users.id),
  status: text("status").default("open"),
  aiCharacteristics: text("ai_characteristics"),
  matchConfidence: text("match_confidence"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

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
export const insertCaseSchema = createInsertSchema(cases);
export const selectCaseSchema = createSelectSchema(cases);
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
