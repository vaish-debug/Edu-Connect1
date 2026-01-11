import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ moduleId, completed }: { moduleId: number; completed: boolean }) => {
      const res = await fetch(api.progress.update.path, {
        method: api.progress.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, completed }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      return api.progress.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.modules.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.progress.studentStats.path] });
    },
  });
}

export function useStudentStats() {
  return useQuery({
    queryKey: [api.progress.studentStats.path],
    queryFn: async () => {
      const res = await fetch(api.progress.studentStats.path);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.progress.studentStats.responses[200].parse(await res.json());
    },
  });
}
