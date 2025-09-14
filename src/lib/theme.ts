// Map your saved hub.theme to utility classes.
// Tailwind cannot read dynamic class names, so keep this mapping in code.

export const accent = (t?: string) => {
  const M = {
    indigo: {
      softBg: "bg-indigo-500/15",
      solidBg: "bg-indigo-500",
      text: "text-indigo-600",
      ring: "ring-indigo-500/30",
      chip: "bg-indigo-600/10 text-indigo-700",
      dot: "bg-indigo-500",
    },
    sky: {
      softBg: "bg-sky-400/15",
      solidBg: "bg-sky-400",
      text: "text-sky-600",
      ring: "ring-sky-400/30",
      chip: "bg-sky-600/10 text-sky-700",
      dot: "bg-sky-400",
    },
    rose: {
      softBg: "bg-rose-500/15",
      solidBg: "bg-rose-500",
      text: "text-rose-600",
      ring: "ring-rose-500/30",
      chip: "bg-rose-600/10 text-rose-700",
      dot: "bg-rose-500",
    },
    emerald: {
      softBg: "bg-emerald-500/15",
      solidBg: "bg-emerald-500",
      text: "text-emerald-600",
      ring: "ring-emerald-500/30",
      chip: "bg-emerald-600/10 text-emerald-700",
      dot: "bg-emerald-500",
    },
    amber: {
      softBg: "bg-amber-500/20",
      solidBg: "bg-amber-500",
      text: "text-amber-600",
      ring: "ring-amber-500/30",
      chip: "bg-amber-600/10 text-amber-700",
      dot: "bg-amber-500",
    },
    zinc: {
      softBg: "bg-zinc-600/15",
      solidBg: "bg-zinc-600",
      text: "text-zinc-700",
      ring: "ring-zinc-600/30",
      chip: "bg-zinc-700/10 text-zinc-700",
      dot: "bg-zinc-600",
    },
  } as const;
  return M[(t as keyof typeof M) || "indigo"];
};
