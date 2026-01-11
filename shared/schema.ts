import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// === TABLE DEFINITIONS ===

// Users: Supports both students and teachers
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "teacher"] }).notNull().default("student"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Modules/Video Lectures
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(), // For MVP, we'll store URL (could be YouTube or direct link)
  teacherId: integer("teacher_id").notNull(), // Who uploaded it
  content: text("content"), // Transcript or summary for AI context
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Progress
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  moduleId: integer("module_id").notNull(),
  completed: boolean("completed").default(false),
  lastPosition: integer("last_position").default(0), // timestamp in seconds
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doubts / Q&A
export const doubts = pgTable("doubts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  moduleId: integer("module_id").notNull(),
  question: text("question").notNull(),
  aiAnswer: text("ai_answer"),
  teacherAnswer: text("teacher_answer"),
  isResolved: boolean("is_resolved").default(false),
  isEscalated: boolean("is_escalated").default(false), // True if AI couldn't answer or student wasn't satisfied
  createdAt: timestamp("created_at").defaultNow(),
});

// Quizzes (AI Generated or Manual)
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  questions: jsonb("questions").notNull(), // Array of { question, options[], correctIndex }
  generatedByAi: boolean("generated_by_ai").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz Results
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  quizId: integer("quiz_id").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Integration Tables (consolidated from models/chat.ts)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// === RELATIONS ===
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(progress),
  doubts: many(doubts),
  quizResults: many(quizResults),
  modules: many(modules), // Teachers have modules
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  teacher: one(users, {
    fields: [modules.teacherId],
    references: [users.id],
  }),
  progress: many(progress),
  doubts: many(doubts),
  quizzes: many(quizzes),
}));

export const doubtsRelations = relations(doubts, ({ one }) => ({
  user: one(users, {
    fields: [doubts.userId],
    references: [users.id],
  }),
  module: one(modules, {
    fields: [doubts.moduleId],
    references: [modules.id],
  }),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
  module: one(modules, {
    fields: [progress.moduleId],
    references: [modules.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true, createdAt: true });
export const insertProgressSchema = createInsertSchema(progress).omit({ id: true, updatedAt: true });
export const insertDoubtSchema = createInsertSchema(doubts).omit({ id: true, createdAt: true, aiAnswer: true, teacherAnswer: true, isResolved: true, isEscalated: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export const insertQuizResultSchema = createInsertSchema(quizResults).omit({ id: true, createdAt: true });

// Chat Schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// === EXPLICIT API CONTRACT TYPES ===
export type User = typeof users.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Doubt = typeof doubts.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizResult = typeof quizResults.$inferSelect;
export type Progress = typeof progress.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type InsertDoubt = z.infer<typeof insertDoubtSchema>;

// Chat Types
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Complex Types
export type ModuleWithProgress = Module & { completed: boolean };
