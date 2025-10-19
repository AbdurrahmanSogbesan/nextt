"use client";

import { apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  CreateHubForm,
  CreateInviteParams,
  GetHubMembersResponse,
  GetHubResponse,
  HubInvite,
  UpdateHubMemberRoleParams,
  UpdateMemberRoleResponse,
} from "@/types/hub";
import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";

export function useGetHub(hubId: string) {
  return useQuery({
    queryKey: ["hub", hubId],
    queryFn: () => apiGet<GetHubResponse>(`/api/hubs/${hubId}`),
  });
}

export function useUpdateLastVisitStatus(
  hubId: string,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["updateLastVisitStatus", hubId],
    queryFn: () => apiPost(`/api/hubs/${hubId}/last-visit`),
    ...options,
  });
}

export function useGetHubMembers(hubId: string) {
  return useQuery({
    queryKey: ["getHubMembers", hubId],
    queryFn: () => apiGet<GetHubMembersResponse>(`/api/hubs/members/${hubId}`),
  });
}

export function useCreateHub(onSuccess: (id: string) => void) {
  return useMutation({
    mutationKey: ["createHub"],
    mutationFn: async (data: CreateHubForm) => {
      const { id } = await apiPost<{ id: string }>("/api/hubs", data);
      return id;
    },
    onSuccess,
    onError(error: Error) {
      console.error("Error creating hub:", error);
      toast.error("Failed to create hub", {
        description: "Please try again",
      });
    },
  });
}

export function useUpdateHubMemberRole(
  hubId: string,
  onSuccess: (data: UpdateMemberRoleResponse["membership"]) => void
) {
  return useMutation({
    mutationKey: ["updateHubMemberRole", hubId],
    mutationFn: async (data: UpdateHubMemberRoleParams) => {
      if (!hubId) throw new Error("Hub ID is required");

      const resp = await apiPatch<UpdateMemberRoleResponse>(
        `/api/hubs/members/${hubId}`,
        data
      );

      return resp.membership;
    },
    onSuccess(data, variables, onMutateResult, context) {
      context.client.invalidateQueries({ queryKey: ["getHubMembers", hubId] });
      toast.success("Member role updated successfully");
      onSuccess(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update member role");
    },
  });
}

export function useRemoveHubMember(hubId: string, onSuccess: () => void) {
  return useMutation({
    mutationKey: ["removeHubMember", hubId],
    mutationFn: async () => {
      //   TODO: Implement remove member API
      //   return Promise.resolve();
    },
    onSuccess,
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove member");
    },
  });
}

export function useCreateInvite(onSuccess: () => void) {
  return useMutation({
    mutationKey: ["createInvite"],
    mutationFn: async (data: CreateInviteParams) => {
      const response = await apiPost<{ invite: HubInvite }>(
        "/api/invite",
        data
      );
      return response.invite;
    },
    onSuccess: () => {
      // todo: invalidate get invites query
      toast.success("Invite created successfully");
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create invite");
    },
  });
}
