"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCrud<T extends { id: number }>(resource: string) {
  const queryClient = useQueryClient();
  const queryKey = [resource];

  const list = useQuery<T[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/${resource}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const create = useMutation({
    mutationFn: async (data: Omit<T, "id">) => {
      const res = await fetch(`/api/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: T) => {
      const res = await fetch(`/api/${resource}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/${resource}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    data: list.data ?? [],
    isLoading: list.isLoading,
    error: list.error,
    create,
    update,
    remove,
    refetch: list.refetch,
  };
}
