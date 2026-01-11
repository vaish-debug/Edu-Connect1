import { z } from 'zod';
import { insertUserSchema, insertModuleSchema, insertDoubtSchema, insertQuizSchema, insertQuizResultSchema, users, modules, doubts, quizzes, quizResults, progress } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  // Auth
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  
  // Modules / Lectures
  modules: {
    list: {
      method: 'GET' as const,
      path: '/api/modules',
      responses: {
        200: z.array(z.custom<typeof modules.$inferSelect & { completed?: boolean }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/modules',
      input: insertModuleSchema,
      responses: {
        201: z.custom<typeof modules.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/modules/:id',
      responses: {
        200: z.custom<typeof modules.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Progress
  progress: {
    update: {
      method: 'POST' as const,
      path: '/api/progress',
      input: z.object({ moduleId: z.number(), completed: z.boolean() }),
      responses: {
        200: z.custom<typeof progress.$inferSelect>(),
      },
    },
    studentStats: {
      method: 'GET' as const,
      path: '/api/teacher/student-stats', // For teacher dashboard
      responses: {
        200: z.array(z.object({
          studentName: z.string(),
          completedModules: z.number(),
          totalModules: z.number(),
          averageQuizScore: z.number(),
        })),
      },
    },
  },

  // Doubts
  doubts: {
    create: {
      method: 'POST' as const,
      path: '/api/doubts',
      input: insertDoubtSchema,
      responses: {
        201: z.custom<typeof doubts.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const, // For student to see their doubts, or teacher to see all
      path: '/api/doubts',
      responses: {
        200: z.array(z.custom<typeof doubts.$inferSelect & { studentName?: string, moduleTitle?: string }>()),
      },
    },
    answer: { // Teacher answers
      method: 'PATCH' as const,
      path: '/api/doubts/:id/answer',
      input: z.object({ answer: z.string() }),
      responses: {
        200: z.custom<typeof doubts.$inferSelect>(),
      },
    },
  },

  // Quizzes
  quizzes: {
    generate: {
      method: 'POST' as const,
      path: '/api/quizzes/generate', // AI generation
      input: z.object({ moduleId: z.number() }),
      responses: {
        201: z.custom<typeof quizzes.$inferSelect>(),
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/quizzes/submit',
      input: insertQuizResultSchema,
      responses: {
        201: z.custom<typeof quizResults.$inferSelect>(),
      },
    },
    getByModule: {
      method: 'GET' as const,
      path: '/api/modules/:id/quiz',
      responses: {
        200: z.custom<typeof quizzes.$inferSelect>().optional(),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
