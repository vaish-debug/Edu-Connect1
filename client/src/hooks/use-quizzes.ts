import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type Quiz, type QuizResult } from "@shared/routes";

export function useModuleQuiz(moduleId: number) {
  return useQuery({
    queryKey: [api.quizzes.getByModule.path, moduleId],
    queryFn: async () => {
      const url = buildUrl(api.quizzes.getByModule.path, { id: moduleId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch quiz");
      const data = await res.json();
      // It might return null if no quiz exists
      return data ? api.quizzes.getByModule.responses[200].parse(data) : null;
    },
    enabled: !!moduleId,
  });
}

export function useGenerateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (moduleId: number) => {
      const res = await fetch(api.quizzes.generate.path, {
        method: api.quizzes.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      if (!res.ok) throw new Error("Failed to generate quiz");
      return api.quizzes.generate.responses[201].parse(await res.json());
    },
    onSuccess: (_, moduleId) => {
      const url = buildUrl(api.quizzes.getByModule.path, { id: moduleId });
      queryClient.invalidateQueries({ queryKey: [api.quizzes.getByModule.path, moduleId] });
    },
  });
}

export function useSubmitQuiz() {
  return useMutation({
    mutationFn: async (result: any) => {
      const res = await fetch(api.quizzes.submit.path, {
        method: api.quizzes.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error("Failed to submit quiz");
      return api.quizzes.submit.responses[201].parse(await res.json());
    },
  });
}
