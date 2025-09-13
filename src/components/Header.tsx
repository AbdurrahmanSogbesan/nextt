"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Bell, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user } = useUser();
  const fullName = user?.fullName || "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        {/* Left: brand */}
        <Link href="" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white shadow-sm">
            <span className="text-sm font-bold">N</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Nextt</span>
        </Link>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Calendar">
            <CalendarDays className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>

          <div className="flex items-center cursor-pointer gap-3 px-2">
            <div className="hidden text-left leading-tight md:block">
              <div className="text-sm font-medium">{fullName}</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>
            <UserButton
              appearance={{
                elements: {
                  userPreview: "hidden",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
