import { RefreshCw } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="size-12 animate-spin" />
    </div>
  );
}
