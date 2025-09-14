import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { accent } from "@/lib/theme";

export default function TurnCard({
  title,
  className,
  image,
  rightText,
  badgeText,
  isActive,
  theme,
}: {
  title: string;
  className?: string;
  image?: string;
  rightText?: string;
  badgeText?: string;
  isActive?: boolean;
  theme?: ReturnType<typeof accent>;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 transition-all",
        className,
        isActive && `${theme?.chip} border-transparent`
      )}
    >
      <div className="text-sm font-medium">{title}</div>

      <div className="flex items-center gap-2">
        {rightText && (
          <span
            className={cn(
              "text-xs text-muted-foreground",
              isActive && theme?.text
            )}
          >
            {rightText}
          </span>
        )}
        {image && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={image} />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        )}
        {badgeText && (
          <Badge variant="outline" className={`${theme?.chip}`}>
            {badgeText}
          </Badge>
        )}
      </div>
    </div>
  );
}
