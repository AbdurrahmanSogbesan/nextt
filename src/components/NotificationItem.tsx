import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EnrichedNotification } from "@/types/notification";
import Initials from "./Initials";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { getFullName } from "@/lib/utils";
export default function NotificationItem({
  notification,
  onAcceptInvite,
  onDeclineInvite,
  onCompleteTurn,
  onDismissTurn,
  isLoading,
}: {
  notification: EnrichedNotification;
  onAcceptInvite: (inviteId: number) => void;
  onDeclineInvite: (inviteId: number) => void;
  onCompleteTurn: (rosterId: number, turnId: number) => void;
  onDismissTurn: (notificationId: number) => void;
  isLoading?: boolean;
}) {
  const isPendingInvite =
    !!notification.invite && notification.invite.status === "PENDING";
  const isTurnConfirmation =
    !!notification.turn && notification.turn.status === "PENDING";
  const showActionButtons = isPendingInvite || isTurnConfirmation;

  const getActorDetails = () => {
    if (notification.invite?.from) {
      return {
        name: getFullName(notification.invite.from),
        avatarUrl: notification.invite.from.avatarUrl,
      };
    }
    if (notification.roster?.createdBy) {
      return {
        name: getFullName(notification.roster.createdBy),
        avatarUrl: notification.roster.createdBy.avatarUrl,
      };
    }
    if (notification.hub?.owner) {
      return {
        name: getFullName(notification.hub.owner),
        avatarUrl: notification.hub.owner.avatarUrl,
      };
    }
    return null;
  };

  const actor = getActorDetails();
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const getNotificationLink = () => {
    if (notification.rosterId && notification.hubId) {
      return `/hubs/${notification.hubId}/rosters/${notification.rosterId}`;
    }
    if (notification.hubId) {
      return `/hubs/${notification.hubId}`;
    }
    return null;
  };

  const link = getNotificationLink();

  const notificationName =
    getFullName(notification.hub?.owner) ||
    getFullName(notification.roster?.createdBy) ||
    notification.hub?.name ||
    notification.roster?.name ||
    actor?.name;

  // Helper function to highlight roster and hub names in the body text
  const highlightNames = (text: string) => {
    if (!text) return text;

    const rosterName = notification.roster?.name;
    const hubName = notification.hub?.name;
    const namesToHighlight = [rosterName, hubName].filter(Boolean) as string[];

    if (namesToHighlight.length === 0) return text;

    // Create a regex that matches any of the names (case-insensitive)
    const pattern = namesToHighlight
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // Escape special regex chars
      .join("|");
    const regex = new RegExp(`(${pattern})`, "gi");

    const parts = text.split(regex);

    console.log(parts);

    const highlightedText = parts.map((part, index) => {
      const isHighlighted = namesToHighlight.some(
        (name) => name.toLowerCase() === part.toLowerCase()
      );
      return isHighlighted ? (
        <span key={index} className="text-red-400">
          &quot;{part}&quot;
        </span>
      ) : (
        part
      );
    });

    // Check if any names were highlighted
    const hasHighlight = parts.some((part) =>
      namesToHighlight.some((name) => name.toLowerCase() === part.toLowerCase())
    );

    // If no names were found in the text, append the first available name
    if (!hasHighlight) {
      const nameToAppend = rosterName || hubName;
      return (
        <>
          {text} in{" "}
          <span className="text-red-400">&quot;{nameToAppend}&quot;</span>
        </>
      );
    }

    return highlightedText;
  };

  const content = (
    <div className="flex items-start justify-between gap-4 rounded-xl border bg-card px-5 py-4 hover:shadow-sm transition-colors">
      <div className="flex gap-3 items-start flex-1">
        <Avatar className="size-10 flex-shrink-0">
          <AvatarImage src={notification.hub?.logo || ""} />
          <AvatarFallback>
            <Initials name={notificationName} />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground mb-0.5">
            {notificationName}
          </p>
          <p className="text-sm text-muted-foreground">
            {highlightNames(notification.body || "")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-shrink-0 items-end">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {timeAgo.replace("about ", "")}
        </span>

        {showActionButtons && (
          <div className="flex gap-2">
            {isPendingInvite ? (
              <>
                <Button
                  size="sm"
                  onClick={() => onAcceptInvite(notification.invite!.id)}
                  disabled={isLoading}
                  className="h-8 px-4 cursor-pointer"
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDeclineInvite(notification.invite!.id)}
                  disabled={isLoading}
                  className="h-8 px-4 cursor-pointer"
                >
                  Decline
                </Button>
              </>
            ) : isTurnConfirmation ? (
              <>
                <Button
                  size="sm"
                  onClick={() =>
                    onCompleteTurn(notification.rosterId!, notification.turnId!)
                  }
                  disabled={isLoading}
                  className="h-8 px-4 cursor-pointer"
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDismissTurn(notification.id)}
                  disabled={isLoading}
                  className="h-8 px-4 cursor-pointer"
                >
                  No
                </Button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  if (link && !showActionButtons) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
}
