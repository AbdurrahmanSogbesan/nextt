"use client";

import { Button } from "@/components/ui/button";
import { cn, getFormattedDate, getNextDate } from "@/lib/utils";
import { RosterMember } from "@/types/roster";
import { useAuth } from "@clerk/nextjs";
import { ROTATION_CHOICE, RotationOption } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Initials from "./Initials";
import { accent } from "@/lib/theme";

export default function RosterSchedule({
  members,
  currentTurnId,
  rotationType,
  rotationOption,
  nextDate,
  onStartRoster,
  isStarted,
  theme,
  isStarting,
}: {
  members: RosterMember[];
  currentTurnId: string | null;
  rotationType: ROTATION_CHOICE;
  rotationOption?: Pick<RotationOption, "rotation" | "unit"> | null;
  nextDate: Date | null;
  onStartRoster?: () => void;
  isStarted: boolean;
  theme?: ReturnType<typeof accent>;
  isStarting: boolean;
}) {
  const { userId } = useAuth();

  if (!isStarted) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <span className="font-medium text-muted-foreground text-center">
          You need to start a roster to see schedule
        </span>
        <Button onClick={onStartRoster} className="gap-2" loading={isStarting}>
          Start Roster
        </Button>
      </div>
    );
  }

  // Find current member's position
  const currentMember = members.find((m) => m.rosterUserId === currentTurnId);
  if (!currentMember) return null;

  // Get next 4 turns after current turn based on positions
  const upcomingTurns: RosterMember[] = [];
  const sortedMembers = [...members].sort((a, b) => a.position - b.position);
  const currentIndex = sortedMembers.findIndex(
    (m) => m.rosterUserId === currentTurnId
  );

  // Get the next 4 members, wrapping around if necessary
  for (let i = 1; i <= 4; i++) {
    const nextIndex = (currentIndex + i) % sortedMembers.length;
    upcomingTurns.push(sortedMembers[nextIndex]);
  }

  // Calculate expected dates for upcoming turns
  const dates: (Date | null)[] = [];
  upcomingTurns.forEach((_, index) => {
    if (index === 0) {
      // First upcoming turn uses the roster's nextDate
      dates.push(nextDate);
    } else {
      // Each subsequent turn is calculated from the previous turn's date
      const previousDate = dates[index - 1];
      if (previousDate) {
        dates.push(getNextDate(rotationType, rotationOption, previousDate));
      } else {
        dates.push(null);
      }
    }
  });

  return (
    <div className="space-y-4">
      <ScheduleCard
        label="Current"
        userName={
          currentTurnId === userId
            ? "Me"
            : `${currentMember.user.firstName} ${currentMember.user.lastName}`
        }
        avatarUrl={currentMember.user.avatarUrl}
        userFullName={`${currentMember.user.firstName} ${currentMember.user.lastName}`}
      />

      {upcomingTurns.map((member, index) => (
        <ScheduleCard
          key={`${member.rosterUserId}-${index}`}
          label={index === 0 ? "Next" : getFormattedDate(dates[index])}
          userName={
            member.rosterUserId === userId
              ? "Me"
              : `${member.user.firstName} ${member.user.lastName}`
          }
          avatarUrl={member.user.avatarUrl}
          userFullName={`${member.user.firstName} ${member.user.lastName}`}
          isActive={index === 0}
          theme={theme}
        />
      ))}
    </div>
  );
}

export function ScheduleCard({
  label,
  userName,
  avatarUrl,
  userFullName,
  isActive,
  theme,
}: {
  label: string;
  userName: string;
  avatarUrl: string;
  userFullName: string;
  isActive?: boolean;
  theme?: ReturnType<typeof accent>;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-5 rounded-xl shadow-sm",
        isActive ? `${theme?.chip}` : "bg-muted/95 text-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "text-lg font-semibold",
            isActive ? theme?.text : "text-foreground/70"
          )}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className={cn(isActive ? theme?.text : "text-foreground/70")}>
          {userName}
        </span>
        <Avatar className="size-9">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>
            <Initials name={userFullName} />
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
