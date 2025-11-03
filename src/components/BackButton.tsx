'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({
  fallbackHref,
}: {
  fallbackHref?: string;
}) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={() => {
        if (history.length > 1) router.back();
        else if (fallbackHref) router.push(fallbackHref);
        else router.push('/dashboard');
      }}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
