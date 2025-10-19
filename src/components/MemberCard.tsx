"use client";

import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemberUserDetails } from "@/types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Initials from "./Initials";
import { cn } from "@/lib/utils";

export default function MemberCard({
  member,
  btnText,
  onBtnClick,
  dropdownItems,
  role,
  isUser,
  variant = "normal",
  btnLoading = false,
}: {
  member: { user: MemberUserDetails };
  btnText?: string;
  onBtnClick?: VoidFunction;
  dropdownItems?: Array<{
    label: string;
    onClick: VoidFunction;
    variant?: "default" | "destructive";
  }>;
  role?: "ADMIN" | "MEMBER";
  isUser?: boolean;
  variant?: "normal" | "small";
  btnLoading?: boolean;
}) {
  const fullName = `${member.user.firstName} ${member.user.lastName}`;
  const isSmall = variant === "small";

  return (
    <Card className={cn("rounded-2xl relative", isSmall && "py-3")}>
      {dropdownItems && (
        <div
          className={
            isSmall ? "absolute top-2 right-2" : "absolute top-3 right-3"
          }
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 hover:bg-accent/50"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {dropdownItems.map(({ label, onClick, variant }, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={onClick}
                  variant={variant}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <CardContent
        className={cn(
          "flex flex-col items-center",
          isSmall ? "py-3 px-4 gap-3" : "py-5 gap-6"
        )}
      >
        <Avatar className={cn("shrink-0", isSmall ? "size-16" : "size-[92px]")}>
          <AvatarImage src={member.user.avatarUrl || ""} />
          <AvatarFallback>
            <Initials name={fullName} />
          </AvatarFallback>
        </Avatar>
        <div className="truncate flex flex-col items-center">
          <p className="text-sm font-medium leading-tight truncate">
            {fullName} {isUser && <span className="text-xs">(Me)</span>}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {member.user.email}
          </p>
          {role && (
            <p
              className={cn(
                "text-muted-foreground/80 capitalize",
                isSmall ? "text-[10px]" : "text-xs"
              )}
            >
              {role.toLowerCase()}
            </p>
          )}
        </div>
        {btnText && (
          <Button
            variant="secondary"
            size={isSmall ? "sm" : "default"}
            className="w-full"
            onClick={onBtnClick}
            loading={btnLoading}
          >
            {btnText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
