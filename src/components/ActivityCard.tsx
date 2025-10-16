"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Initials from "@/components/Initials";
import { MemberUserDetails } from "@/types";

interface ActivityCardProps {
  title: string;
  body: string;
  actor: MemberUserDetails;
  createdAt: Date;
}

export default function ActivityCard({
  title,
  body,
  actor,
  createdAt,
}: ActivityCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={actor.avatarUrl || ""} />
          <AvatarFallback>
            <Initials name={`${actor.firstName} ${actor.lastName}`} />
          </AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{body}</p>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {new Date(createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}
