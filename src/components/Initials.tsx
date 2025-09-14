export default function Initials({ name }: { name?: string | null }) {
  const n = (name || "").trim();
  const parts = n.split(" ");
  const init = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return <>{init.toUpperCase() || "U"}</>;
}
