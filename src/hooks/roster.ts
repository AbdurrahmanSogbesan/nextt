"use client";

import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import { CreateRosterForm } from "@/types/roster";
import { toast } from "sonner";

export function useCreateRoster(onSuccess: (id: string) => void) {
  return useMutation({
    mutationKey: ["createRoster"],
    mutationFn: async (data: CreateRosterForm) => {
      const { id } = await apiPost<{ id: string }>("/api/rosters", data);
      return id;
    },
    onSuccess,
    onError: (error) => {
      console.error("Error creating roster:", error);
      toast.error("Failed to create roster", {
        description: "Please try again",
      });
    },
  });
}
