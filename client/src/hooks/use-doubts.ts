import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertDoubt } from "@shared/routes";

export function useDoubts() {
  return useQuery({
    queryKey: [api.doubts.list.path],
    queryFn: async () => {
      const res = await fetch(api.doubts.list.path);
      if (!res.ok) throw new Error("Failed to fetch doubts");
      return api.doubts.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateDoubt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertDoubt) => {
      const res = await fetch(api.doubts.create.path, {
        method: api.doubts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create doubt");
      return api.doubts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.doubts.list.path] });
    },
  });
}

export function useAnswerDoubt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, answer }: { id: number; answer: string }) => {
      const url = buildUrl(api.doubts.answer.path, { id });
      const res = await fetch(url, {
        method: api.doubts.answer.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return api.doubts.answer.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.doubts.list.path] });
    },
  });
}
