import { MemberUserDetails } from "@/types";
import { ROTATION_CHOICE, ROTATION_TYPE, RotationOption } from "@prisma/client";
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
  rotationOption?: Pick<RotationOption, "rotation" | "unit"> | null
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
