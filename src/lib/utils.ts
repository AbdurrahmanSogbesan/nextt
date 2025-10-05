import { MemberUserDetails } from "@/types";
import { ROTATION_CHOICE, ROTATION_TYPE, RotationOption } from "@prisma/client";
import type { Rotation } from "@/types/roster";
import { clsx, type ClassValue } from "clsx";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFormattedDate(date: string | number | Date | null) {
  if (!date) return "";
  const inputDate = new Date(date);

  if (isYesterday(inputDate)) return "Yesterday";
  if (isToday(inputDate)) return "Today";
  if (isTomorrow(inputDate)) return "Tomorrow";

  return format(inputDate, "do MMM, yyyy");
}

/**
 * Gets user info from the user map or returns a fallback
 */
export function getUserInfo(
  userMap: Map<string, MemberUserDetails>,
  userId: string
): MemberUserDetails {
  return (
    userMap.get(userId) || {
      firstName: "Unknown",
      lastName: "User",
      email: "",
      avatarUrl: "",
    }
  );
}

export function getNextDate(
  rotationType: ROTATION_CHOICE,
  rotationOption?: Pick<RotationOption, "rotation" | "unit">
) {
  const now = new Date();

  // Change date based on rotation type
  if (rotationType === ROTATION_CHOICE.DAILY) {
    now.setDate(now.getDate() + 1);
  } else if (rotationType === ROTATION_CHOICE.WEEKLY) {
    now.setDate(now.getDate() + 7);
  } else if (rotationType === ROTATION_CHOICE.MONTHLY) {
    now.setMonth(now.getMonth() + 1);
  } else if (rotationType === ROTATION_CHOICE.ANNUALLY) {
    now.setFullYear(now.getFullYear() + 1);
  } else if (rotationType === ROTATION_CHOICE.CUSTOM) {
    // changes date based on custom rotation option
    if (rotationOption) {
      if (rotationOption.rotation === ROTATION_TYPE.DAILY) {
        now.setDate(now.getDate() + rotationOption.unit);
      } else if (rotationOption.rotation === ROTATION_TYPE.WEEKLY) {
        now.setDate(now.getDate() + rotationOption.unit * 7);
      } else if (rotationOption.rotation === ROTATION_TYPE.ANNUALLY) {
        now.setFullYear(now.getFullYear() + rotationOption.unit);
      }
    }
  }

  const dateString = now.toISOString() as unknown;

  return dateString as Date;
}


export function startOfDay(d: Date) { const x = new Date(d); x.setUTCHours(0,0,0,0); return x; }
export function endOfDay(d: Date) { const x = new Date(d); x.setUTCHours(23,59,59,999); return x; }

export function startOfISOWeek(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7; if (day !== 1) x.setUTCDate(x.getUTCDate() - (day - 1));
  return x;
}
export function endOfISOWeek(d: Date) {
  const s = startOfISOWeek(d);
  const e = new Date(s);
  e.setUTCDate(e.getUTCDate() + 6);
  e.setUTCHours(23,59,59,999);
  return e;
}
