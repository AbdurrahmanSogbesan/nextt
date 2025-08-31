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
