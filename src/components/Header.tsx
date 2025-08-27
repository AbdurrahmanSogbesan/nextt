'use client';

import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';
import { Bell, CalendarDays, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Header() {
  const { user } = useUser();
  const fullName = user?.fullName || 'Account';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        {/* Left: brand */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white shadow-sm">
            <span className="text-sm font-bold">N</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Nextt</span>
        </Link>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Calendar">
            <CalendarDays className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center cursor-pointer gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.imageUrl ?? ''} alt={fullName} />
                  <AvatarFallback>
                    {fullName.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left leading-tight md:block">
                  <div className="text-sm font-medium">{fullName}</div>
                  <div className="text-xs text-muted-foreground">{email}</div>
                </div>
                <ChevronDown className="ml-1 hidden h-4 w-4 md:block" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
              <div className="px-2 pb-1 text-xs text-muted-foreground">
                {email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <UserButton
                  appearance={{
                    elements: {
                      userPreview: 'hidden',
                    },
                  }}
                ></UserButton>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
