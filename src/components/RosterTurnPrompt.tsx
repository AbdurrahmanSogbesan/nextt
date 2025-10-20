"use client";

import { cn, getFormattedDate } from "@/lib/utils";
import { accent } from "@/lib/theme";
import { Button } from "./ui/button";

export default function RosterTurnPrompt({
  rosterName,
  dueDate,
  theme,
  onComplete,
  isCompleting,
}: {
  rosterName: string;
  dueDate: Date | null;
  theme?: ReturnType<typeof accent>;
  onComplete: VoidFunction;
  isCompleting: boolean;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-accent-foreground">
        Hey!!! You&apos;re up
      </h2>

      {/* Card content */}
      <div className="flex flex-col gap-5 rounded-2xl bg-muted p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg text-foreground/80 font-semibold">
            Have You completed your turn in{" "}
            <span className={cn("font-medium", theme?.text)}>
              &quot;{rosterName}&quot;
            </span>
          </p>

          <p className="text-xs text-foreground/70">
            Due {getFormattedDate(dueDate)}
          </p>
        </div>

        <div className="flex justify-center gap-2">
          <Button
            onClick={onComplete}
            className="flex-1 max-w-[228px] py-[6px]"
            loading={isCompleting}
          >
            Yes
          </Button>
          <Button variant="outline" className="flex-1 max-w-[228px] py-[6px]">
            No
          </Button>
        </div>
      </div>
    </section>
  );
}
