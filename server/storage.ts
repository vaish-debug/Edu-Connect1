import { db } from "./db";
import { users, modules, doubts, quizzes, quizResults, progress, type User, type InsertUser, type InsertModule, type InsertDoubt, type Module, type Doubt, type Quiz, type QuizResult, type Progress } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Modules
  getModules(): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  getModule(id: number): Promise<Module | undefined>;

  // Progress
  updateProgress(userId: number, moduleId: number, completed: boolean): Promise<Progress>;
  getProgress(userId: number): Promise<Progress[]>;
  getAllStudentProgress(): Promise<(User & { progress: Progress[] })[]>;

  // Doubts
  createDoubt(doubt: InsertDoubt): Promise<Doubt>;
  getDoubts(userId?: number): Promise<(Doubt & { studentName?: string, moduleTitle?: string })[]>;
  updateDoubtAnswer(id: number, teacherAnswer: string): Promise<Doubt>;
  
  // Quizzes
  createQuiz(moduleId: number, questions: any): Promise<Quiz>;
  getQuizByModule(moduleId: number): Promise<Quiz | undefined>;
  submitQuizResult(userId: number, quizId: number, score: number, totalQuestions: number): Promise<QuizResult>;
  getStudentQuizStats(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Modules
  async getModules(): Promise<Module[]> {
    return await db.select().from(modules).orderBy(modules.order);
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const [module] = await db.insert(modules).values(insertModule).returning();
    return module;
  }

  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  // Progress
  async updateProgress(userId: number, moduleId: number, completed: boolean): Promise<Progress> {
    const [existing] = await db.select().from(progress)
      .where(and(eq(progress.userId, userId), eq(progress.moduleId, moduleId)));

    if (existing) {
      const [updated] = await db.update(progress)
        .set({ completed, updatedAt: new Date() })
        .where(eq(progress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newProgress] = await db.insert(progress)
        .values({ userId, moduleId, completed })
        .returning();
      return newProgress;
    }
  }

  async getProgress(userId: number): Promise<Progress[]> {
    return await db.select().from(progress).where(eq(progress.userId, userId));
  }

  async getAllStudentProgress(): Promise<(User & { progress: Progress[] })[]> {
    const allUsers = await db.select().from(users).where(eq(users.role, "student"));
    const result = [];
    for (const user of allUsers) {
      const userProgress = await this.getProgress(user.id);
      result.push({ ...user, progress: userProgress });
    }
    return result;
  }

  // Doubts
  async createDoubt(insertDoubt: InsertDoubt): Promise<Doubt> {
    const [doubt] = await db.insert(doubts).values(insertDoubt).returning();
    return doubt;
  }

  async getDoubts(userId?: number): Promise<(Doubt & { studentName?: string, moduleTitle?: string })[]> {
    const query = db.select({
      doubt: doubts,
      studentName: users.name,
      moduleTitle: modules.title
    })
    .from(doubts)
    .leftJoin(users, eq(doubts.userId, users.id))
    .leftJoin(modules, eq(doubts.moduleId, modules.id));

    if (userId) {
      // If user is provided, filter by user (for students)
      query.where(eq(doubts.userId, userId));
    }

    const results = await query;
    return results.map(r => ({ ...r.doubt, studentName: r.studentName || undefined, moduleTitle: r.moduleTitle || undefined }));
  }

  async updateDoubtAnswer(id: number, teacherAnswer: string): Promise<Doubt> {
    const [updated] = await db.update(doubts)
      .set({ teacherAnswer, isResolved: true, isEscalated: false })
      .where(eq(doubts.id, id))
      .returning();
    return updated;
  }

  // Quizzes
  async createQuiz(moduleId: number, questions: any): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values({ moduleId, questions }).returning();
    return quiz;
  }

  async getQuizByModule(moduleId: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.moduleId, moduleId));
    return quiz;
  }

  async submitQuizResult(userId: number, quizId: number, score: number, totalQuestions: number): Promise<QuizResult> {
    const [result] = await db.insert(quizResults).values({ userId, quizId, score, totalQuestions }).returning();
    return result;
  }

  async getStudentQuizStats(): Promise<any[]> {
    // This is a simplified stats aggregation
    // Real implementation would join tables properly
    const results = await db.select().from(quizResults);
    // In a real app, we'd aggregate this by student
    return results;
  }
}

export const storage = new DatabaseStorage();
