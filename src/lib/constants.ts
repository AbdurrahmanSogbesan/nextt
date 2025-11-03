import { ROTATION_CHOICE, ROTATION_TYPE } from "@prisma/client";

export const THEME_CHOICE = [
  "indigo",
  "sky",
  "rose",
  "emerald",
  "amber",
  "zinc",
];

export const rotationChoiceLabels: Record<ROTATION_CHOICE, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  ANNUALLY: "Annually",
  CUSTOM: "Custom",
};

export const rotationTypeLabels: Record<ROTATION_TYPE, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  ANNUALLY: "Annually",
};

// const statusLabels: Record<STATUS_CHOICE, string> = {
//   ONGOING: "Ongoing",
//   PENDING: "Pending",
//   COMPLETE: "Complete",
// };
