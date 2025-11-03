'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Building2,
  ChevronRight,
  LogOut,
  HelpCircle,
  Settings,
  Plus,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SignOutButton } from '@clerk/nextjs';
import { PrismaHub } from '../types/hub';

const themeDot: Record<string, string> = {
  indigo: 'bg-indigo-500',
  sky: 'bg-sky-400',
  rose: 'bg-rose-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  zinc: 'bg-zinc-600',
};

export function HubSwitcher() {
  const [open, setOpen] = useState(false);
  const [hubs, setHubs] = useState<PrismaHub[]>([]);
  const [q, setQ] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    fetch('/api/hubs/mine')
      .then((r) => r.json())
      .then((data) => setHubs(data.hubs ?? []))
      .catch(() => setHubs([]));
  }, [open]);

  // Close the sidebar after navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const filtered = hubs.filter((h) =>
    h.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          aria-label="Open hubs"
          color="blue"
          className="bg-blue-400 hover:bg-blue-300"
        >
          <Building2 color="white" className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[360px] p-0">
        <div className="flex h-full flex-col">
          <div className="px-4 pb-3 pt-5">
            <SheetHeader>
              <SheetTitle className="text-left">Your hubs</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <Input
                placeholder="Search hubs"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <ScrollArea className="flex-1">
            <div className="px-2 py-3">
              {filtered.length === 0 && (
                <div className="px-2 py-10 text-center text-sm text-muted-foreground">
                  No hubs found
                </div>
              )}

              <ul className="space-y-2">
                {filtered.map((hub) => (
                  <li key={hub.id}>
                    <button
                      onClick={() => router.push(`/hubs/${hub.id}`)}
                      className="group flex w-full items-center justify-between rounded-xl border bg-card px-3 py-3 text-left transition hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        {hub.logo ? (
                          <div className="relative h-8 w-8 overflow-hidden rounded-xl ring-1 ring-border">
                            <Image
                              src={hub.logo}
                              alt={hub.name}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`h-8 w-8 rounded-xl ${
                              themeDot[hub.theme ?? 'indigo']
                            }`}
                          />
                        )}
                        <div className="leading-tight">
                          <div className="text-sm font-medium">{hub.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {hub.visibility}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-60 group-hover:opacity-90" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollArea>

          <Separator />

          {/* Bottom actions */}
          <div className="flex flex-col gap-2 p-3">
            <Link href="/hubs/create">
              <Button className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Create a hub
              </Button>
            </Link>

            <Link href="/settings">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>

            <Link href="/help">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <HelpCircle className="h-4 w-4" />
                Help
              </Button>
            </Link>

            <SignOutButton redirectUrl="/sign-in">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-rose-600 hover:text-rose-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </SignOutButton>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
