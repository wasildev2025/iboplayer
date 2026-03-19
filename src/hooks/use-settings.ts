"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SettingsKey } from "@/types";

export function useSettings<T>(key: SettingsKey) {
  const queryClient = useQueryClient();
  const queryKey = ["settings", key];

  const query = useQuery<T>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/settings/${key}`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const save = useMutation({
    mutationFn: async (data: Partial<T>) => {
      const res = await fetch(`/api/settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    save,
  };
}
