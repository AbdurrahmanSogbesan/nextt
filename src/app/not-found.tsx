"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Large 404 */}
        <div className="relative">
          <h1 className="text-[150px] md:text-[200px] font-bold text-foreground/5 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="h-20 w-20 md:h-24 md:w-24 text-muted-foreground/30" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Page not found
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It
            might have been moved or doesn&apos;t exist.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
          <Button
            onClick={handleGoBack}
            variant="default"
            size="lg"
            className="gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
          <Link href="#" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="gap-2 w-full">
              <Home className="h-4 w-4" />
              Go to home
            </Button>
          </Link>
        </div>

        {/* Optional help text */}
        <p className="text-sm text-muted-foreground/60 pt-8">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
