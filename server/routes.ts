import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import createMemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { registerChatRoutes } from "./replit_integrations/chat/routes";
import { registerImageRoutes } from "./replit_integrations/image/routes";
import { openai } from "./replit_integrations/image/client"; // Reuse the client
import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  const MemoryStore = createMemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || user.password !== password) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(input);
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });

  // Middleware for auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    next();
  };

  const requireTeacher = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // Modules
  app.get(api.modules.list.path, requireAuth, async (req, res) => {
    const modules = await storage.getModules();
    // In a real app we would join progress here
    // For now returning raw modules, frontend can fetch progress separately
    res.json(modules);
  });

  app.post(api.modules.create.path, requireTeacher, async (req, res) => {
    try {
      const input = api.modules.create.input.parse(req.body);
      const module = await storage.createModule(input);
      res.status(201).json(module);
    } catch (err) {
       res.status(400).json({ message: "Validation error" });
    }
  });

  app.get(api.modules.get.path, requireAuth, async (req, res) => {
    const module = await storage.getModule(Number(req.params.id));
    if (!module) return res.status(404).json({ message: "Not found" });
    res.json(module);
  });

  // Progress
  app.post(api.progress.update.path, requireAuth, async (req, res) => {
    const { moduleId, completed } = req.body;
    const progress = await storage.updateProgress(req.user!.id, moduleId, completed);
    res.json(progress);
  });

  app.get(api.progress.studentStats.path, requireTeacher, async (req, res) => {
    const students = await storage.getAllStudentProgress();
    const stats = students.map(s => ({
      studentName: s.name,
      completedModules: s.progress.filter(p => p.completed).length,
      totalModules: 0, // Should be total modules count
      averageQuizScore: 0 // Placeholder
    }));
    res.json(stats);
  });

  // Doubts
  app.post(api.doubts.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.doubts.create.input.parse(req.body);
      
      // AI Attempt
      let aiAnswer = null;
      let isResolved = false;
      let isEscalated = false;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            { role: "system", content: "You are a helpful teaching assistant. Answer the student's doubt. If the question is too complex or requires specific context you don't have, advise them to wait for the teacher." },
            { role: "user", content: input.question }
          ]
        });
        aiAnswer = response.choices[0].message.content;
        
        // Simple heuristic: if AI says "wait for teacher", escalate
        if (aiAnswer?.toLowerCase().includes("wait for the teacher") || aiAnswer?.toLowerCase().includes("ask the teacher")) {
            isEscalated = true;
            isResolved = false;
        } else {
            isResolved = true; // Assume AI resolved it initially, student can re-open
        }

      } catch (e) {
        console.error("AI Error", e);
        isEscalated = true;
      }

      const doubt = await storage.createDoubt({
        ...input,
        aiAnswer: aiAnswer || undefined,
        isResolved,
        isEscalated
      });
      
      res.status(201).json(doubt);
    } catch (err) {
      res.status(400).json({ message: "Error creating doubt" });
    }
  });

  app.get(api.doubts.list.path, requireAuth, async (req, res) => {
    const userId = req.user!.role === 'student' ? req.user!.id : undefined;
    const doubts = await storage.getDoubts(userId);
    res.json(doubts);
  });

  app.patch(api.doubts.answer.path, requireTeacher, async (req, res) => {
    const { answer } = req.body;
    const updated = await storage.updateDoubtAnswer(Number(req.params.id), answer);
    res.json(updated);
  });

  // Quizzes
  app.post(api.quizzes.generate.path, requireTeacher, async (req, res) => {
    const { moduleId } = req.body;
    const module = await storage.getModule(moduleId);
    if (!module) return res.status(404).json({ message: "Module not found" });

    try {
       const response = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            { role: "system", content: "Generate a quiz with 3 multiple choice questions based on the provided content. Return JSON in format: [{ question: string, options: string[], correctIndex: number }]" },
            { role: "user", content: `Title: ${module.title}. Content: ${module.content || module.description}` }
          ],
          response_format: { type: "json_object" }
       });
       
       const content = response.choices[0].message.content;
       // Parse the JSON. The model might return { "questions": [...] } or just [...]
       let questions = JSON.parse(content || "[]");
       if (questions.questions) questions = questions.questions;

       const quiz = await storage.createQuiz(moduleId, questions);
       res.status(201).json(quiz);

    } catch (e) {
        console.error("Quiz gen error", e);
        res.status(500).json({ message: "Failed to generate quiz" });
    }
  });
  
  app.get(api.quizzes.getByModule.path, requireAuth, async (req, res) => {
     const quiz = await storage.getQuizByModule(Number(req.params.id));
     res.json(quiz || null);
  });
  
  app.post(api.quizzes.submit.path, requireAuth, async (req, res) => {
    const input = api.quizzes.submit.input.parse(req.body);
    const result = await storage.submitQuizResult(req.user!.id, input.quizId, input.score, input.totalQuestions);
    res.status(201).json(result);
  });

  // Register AI routes
  registerChatRoutes(app);
  registerImageRoutes(app);
  
  // Seed data
  if (process.env.NODE_ENV !== "production") {
    const users = await storage.getUserByUsername("teacher");
    if (!users) {
        await storage.createUser({
            username: "teacher",
            password: "password",
            role: "teacher",
            name: "Mr. Teacher"
        });
        await storage.createUser({
            username: "student",
            password: "password",
            role: "student",
            name: "Alice Student"
        });
    }
  }

  return httpServer;
}
