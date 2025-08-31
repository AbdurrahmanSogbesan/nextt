'use client';

import { cn } from '@/lib/utils';

type Swatch = {
  value: string;
  label: string;
  bg: string; // Tailwind class
};

export default function ThemeSwatches({
  value,
  onChange,
  options,
}: {
  value?: string | null;
  onChange: (val: string) => void;
  options?: Swatch[];
}) {
  const items = options ?? [
    { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
    { value: 'sky', label: 'Sky', bg: 'bg-sky-400' },
    { value: 'rose', label: 'Rose', bg: 'bg-rose-500' },
    { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
    { value: 'amber', label: 'Amber', bg: 'bg-amber-500' },
    { value: 'zinc', label: 'Zinc', bg: 'bg-zinc-600' },
  ];

  return (
    <div role="radiogroup" className="flex flex-wrap gap-3">
      {items.map((s) => {
        const selected = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={s.label}
            onClick={() => onChange(s.value)}
            className={cn(
              'relative h-10 w-10 rounded-full transition',
              s.bg,
              'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              selected ? 'ring-2 ring-foreground/80' : 'ring-0'
            )}
          >
            <span className="sr-only">{s.label}</span>
            {selected && (
              <span className="absolute inset-0 rounded-full border-2 border-white/70" />
            )}
          </button>
        );
      })}
    </div>
  );
}
