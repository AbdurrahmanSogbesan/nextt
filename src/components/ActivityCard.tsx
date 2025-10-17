"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Initials from "@/components/Initials";
import { MemberUserDetails } from "@/types";
import { cn } from "@/lib/utils";

export default function ActivityCard({
  title,
  body,
  actor,
  createdAt,
  variant = "primary",
}: {
  title: string;
  body: string;
  actor: MemberUserDetails;
  createdAt: Date;
  variant?: "primary" | "secondary";
}) {
  return (
    <div
      className={cn(
        "flex justify-between rounded-xl border bg-card px-5 py-4",
        {
          "border-indigo-600/60 bg-indigo-100/15": variant === "primary",
          "border-orange-600/60 bg-orange-100/15": variant === "secondary",
        }
      )}
    >
      <div className="flex gap-3 align-text-top">
        <Avatar className="size-10">
          <AvatarImage src={actor.avatarUrl || ""} />
          <AvatarFallback>
            <Initials name={`${actor.firstName} ${actor.lastName}`} />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <p className="text-xl font-medium">{title}</p>
          <p className="text-black/60">{body}</p>
        </div>
      </div>
      <div
        className={cn(
          "text-xs text-foreground border bg-white rounded-lg p-[10px] h-fit",
          {
            "border-indigo-600/60": variant === "primary",
            "border-orange-600/60": variant === "secondary",
          }
        )}
      >
        {new Date(createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}
