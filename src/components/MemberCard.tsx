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

export default function MemberCard({
  member,
  btnText,
  onBtnClick,
  dropdownItems,
  role,
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
}) {
  const fullName = `${member.user.firstName} ${member.user.lastName}`;
  return (
    <Card className="rounded-2xl relative">
      {dropdownItems && (
        <div className="absolute top-3 right-3">
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
      <CardContent className="py-5 flex flex-col items-center gap-6">
        <Avatar className="size-[92px] shrink-0">
          <AvatarImage src={member.user.avatarUrl || ""} />
          <AvatarFallback>
            <Initials name={fullName} />
          </AvatarFallback>
        </Avatar>
        <div className="truncate flex flex-col items-center">
          <p className="text-sm font-medium leading-tight truncate">
            {fullName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {member.user.email}
          </p>
          {role && (
            <p className="text-xs text-muted-foreground/80 capitalize">
              {role.toLowerCase()}
            </p>
          )}
        </div>
        {btnText && (
          <Button variant="secondary" className="w-full" onClick={onBtnClick}>
            {btnText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
