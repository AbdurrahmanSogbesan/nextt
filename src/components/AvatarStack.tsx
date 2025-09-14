import Initials from "./Initials";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function AvatarStack({
  people,
  max = 5,
}: {
  people: { name?: string | null; avatarUrl?: string | null }[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const extra = Math.max(0, people.length - shown.length);
  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => (
        <Avatar key={i} className="h-7 w-7 ring-2 ring-background">
          <AvatarImage src={p.avatarUrl || ""} />
          <AvatarFallback className="text-[10px]">
            <Initials name={p.name || ""} />
          </AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 && (
        <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-medium ring-2 ring-background">
          +{extra}
        </div>
      )}
    </div>
  );
}
