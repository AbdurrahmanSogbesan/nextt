import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="w-svw h-svh bg-white flex items-center justify-center">
      <SignIn forceRedirectUrl="/auth/callback" />
    </div>
  );
}
