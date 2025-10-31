import { apiGet, apiPost } from "@/lib/api";
import { UpdateInviteParams, UpdateInviteResponse } from "@/types";
import {
  GetNotificationsResponse,
  NotificationFilter,
} from "@/types/notification";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function useGetNotifications(filter: NotificationFilter = "all") {
  return useQuery({
    queryKey: ["getNotifications", filter],
    queryFn: () =>
      apiGet<GetNotificationsResponse>(`/api/notifications?filter=${filter}`),
  });
}

export function useUpdateInvite(
  onSuccess: (data: UpdateInviteResponse) => void
) {
  return useMutation({
    mutationKey: ["updateInvite"],
    mutationFn: async ({ inviteId, response }: UpdateInviteParams) => {
      const resp = await apiPost<UpdateInviteResponse>(
        `/api/invite/${inviteId}`,
        { response }
      );
      return resp;
    },
    onSuccess(data, variables, onMutateResult, context) {
      context.client.invalidateQueries({
        queryKey: ["getNotifications"],
        exact: false,
      });
      toast.success(
        `Invitation ${data.message === "ACCEPTED" ? "accepted" : "rejected"}`
      );
      onSuccess(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to accept invitation");
    },
  });
}
