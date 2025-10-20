import { useMutation, useQuery } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  AddRosterMemberParams,
  AddRosterMemberResponse,
  CreateRosterForm,
  GetRosterResponse,
  GetRosterMembersResponse,
  RemoveRosterMemberResponse,
  UpdateRosterMemberRoleResponse,
  UpdateRosterMemberRoleParams,
} from "@/types/roster";
import { toast } from "sonner";
import z from "zod";
import { createRosterCommentSchema } from "@/lib/schemas";

export function useGetRoster(rosterId: string) {
  return useQuery({
    queryKey: ["getRoster", rosterId],
    queryFn: () => apiGet<GetRosterResponse>(`/api/rosters/${rosterId}`),
  });
}

export function useStartRoster(rosterId: string) {
  return useMutation({
    mutationKey: ["startRoster", rosterId],
    mutationFn: async () => {
      await apiPost(`/api/rosters/${rosterId}/start`);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      toast.success("Roster started successfully");
      context.client.invalidateQueries({ queryKey: ["getRoster", rosterId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start roster");
    },
  });
}

export function useCompleteTurn(rosterId: string, onSuccess?: () => void) {
  return useMutation({
    mutationKey: ["completeTurn", rosterId],
    mutationFn: async (turnId: number) => {
      await apiPost(`/api/rosters/${rosterId}/complete-turn`, { turnId });
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      toast.success("Turn completed successfully");
      context.client.invalidateQueries({ queryKey: ["getRoster", rosterId] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Error completing turn:", error);
      toast.error(error.message || "Failed to complete turn");
    },
  });
}

export function useAddComment(rosterId: string) {
  return useMutation({
    mutationKey: ["addComment", rosterId],
    mutationFn: async (data: z.infer<typeof createRosterCommentSchema>) => {
      await apiPost(`/api/rosters/${rosterId}/comment`, data);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      toast.success("Comment added successfully");
      context.client.invalidateQueries({ queryKey: ["getRoster", rosterId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });
}

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

export function useAddRosterMember(rosterId: string, onSuccess: () => void) {
  return useMutation({
    mutationKey: ["addRosterMember", rosterId],
    mutationFn: async (data: AddRosterMemberParams) => {
      const response = await apiPost<AddRosterMemberResponse>(
        `/api/rosters/${rosterId}/members`,
        data
      );
      return response.member;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["getRoster", rosterId] });

      toast.success("Member added successfully");
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add member");
    },
  });
}

export function useGetRosterMembers(rosterId: string) {
  return useQuery({
    queryKey: ["rosterMembers", rosterId],
    queryFn: () =>
      apiGet<GetRosterMembersResponse>(`/api/rosters/${rosterId}/members`),
  });
}

export function useRemoveRosterMember(
  rosterId: string,
  onSuccess?: () => void
) {
  return useMutation({
    mutationKey: ["removeRosterMember", rosterId],
    mutationFn: async ({ rosterUserId }: { rosterUserId: string }) => {
      const response = await apiDelete<RemoveRosterMemberResponse>(
        `/api/rosters/${rosterId}/members`,
        {
          data: { rosterUserId },
        }
      );

      return response.member;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      toast.success("Member removed successfully");
      context.client.invalidateQueries({
        queryKey: ["rosterMembers", rosterId],
      });
      context.client.invalidateQueries({ queryKey: ["getRoster", rosterId] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove member");
    },
  });
}

export function useUpdateRosterMemberRole(
  rosterId: string,
  onSuccess?: () => void
) {
  return useMutation({
    mutationKey: ["updateRosterMemberRole", rosterId],
    mutationFn: async (params: UpdateRosterMemberRoleParams) => {
      const resp = await apiPatch<UpdateRosterMemberRoleResponse>(
        `/api/rosters/${rosterId}/members`,
        params
      );

      return resp.member;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      toast.success("Member role updated successfully");
      context.client.invalidateQueries({
        queryKey: ["rosterMembers", rosterId],
      });
      context.client.invalidateQueries({ queryKey: ["getRoster", rosterId] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update member role");
    },
  });
}
