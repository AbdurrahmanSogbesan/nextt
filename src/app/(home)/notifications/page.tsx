"use client";

import { useState } from "react";
import { useGetNotifications, useUpdateInvite } from "@/hooks/notification";
import NotificationItem from "@/components/NotificationItem";
import Loading from "@/components/Loading";
import { NotificationFilter } from "@/types/notification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell } from "lucide-react";
import { useCompleteTurn } from "@/hooks/roster";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [actioningNotificationId, setActioningNotificationId] = useState<
    number | null
  >(null);
  const router = useRouter();

  const { data, isLoading } = useGetNotifications(filter);
  const { mutateAsync: updateInvite, isPending: isUpdatingInvite } =
    useUpdateInvite((data) => {
      if (data.message === "ACCEPTED") {
        if (data.rosterId) {
          router.push(`/hubs/${data.hubId}/rosters/${data.rosterId}`);
        }
        if (data.hubId) {
          router.push(`/hubs/${data.hubId}`);
        }
      }
      setActioningNotificationId(null);
    });

  const { mutateAsync: completeTurn, isPending: isCompletingTurn } =
    useCompleteTurn(() => {
      setActioningNotificationId(null);
    });

  const handleAcceptInvite = async (inviteId: number) => {
    setActioningNotificationId(inviteId);
    await updateInvite({ inviteId, response: "ACCEPT" });
  };

  const handleDeclineInvite = async (inviteId: number) => {
    setActioningNotificationId(inviteId);
    await updateInvite({ inviteId, response: "REJECT" });
  };

  const handleCompleteTurn = async (rosterId: number, turnId: number) => {
    setActioningNotificationId(turnId);
    await completeTurn({ rosterId, turnId });
  };

  const handleDismissTurn = async (notificationId: number) => {
    // For now, just clear the actioning state
    // In the future, you might want to add a "dismiss" API endpoint
    setActioningNotificationId(null);
  };

  if (isLoading) return <Loading />;

  const notifications = data?.notifications || [];

  return (
    <div className="min-h-screen">
      <section className="relative border-b backdrop-blur-2xl">
        <div className="relative mx-auto w-full max-w-6xl px-4 py-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Notifications
              </h1>
            </div>

            <Select
              value={filter}
              onValueChange={(value) => setFilter(value as NotificationFilter)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="invitations">Invitations</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onAcceptInvite={handleAcceptInvite}
                onDeclineInvite={handleDeclineInvite}
                onCompleteTurn={handleCompleteTurn}
                onDismissTurn={handleDismissTurn}
                isLoading={
                  (actioningNotificationId === notification.id ||
                    actioningNotificationId === notification.invite?.id ||
                    actioningNotificationId === notification.turnId) &&
                  (isUpdatingInvite || isCompletingTurn)
                }
              />
            ))
          ) : (
            <div className="w-full flex flex-col items-center gap-6 py-16">
              <Bell
                className="h-24 w-24 text-muted-foreground/80"
                strokeWidth={1}
              />
              <div className="text-center">
                <p className="font-medium text-muted-foreground">
                  No notifications yet
                </p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {filter === "all"
                    ? "You're all caught up!"
                    : filter === "invitations"
                    ? "No pending invitations"
                    : "No task notifications"}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
