'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, UploadCloud, ImageUp, Loader2, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  helperText?: string;
  maxSizeMB?: number;
  squareHint?: boolean;
};

export default function Dropzone({
  value,
  onChange,
  className,
  helperText = 'PNG or SVG up to 2 MB. Drag a file or click to select.',
  maxSizeMB = 2,
  squareHint = true,
}: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { useUploadThing } = generateReactHelpers<OurFileRouter>();

  useEffect(() => setPreview(value ?? null), [value]);

  const { startUpload } = useUploadThing(
    (routeRegistry) => routeRegistry.imageUploader,
    {
      onUploadProgress: (p) => setProgress(p),
      onClientUploadComplete: (res) => {
        const url = res?.[0]?.url;
        if (url) {
          setPreview(url);
          onChange(url);
        }
        setUploading(false);
        setProgress(100);
      },
      onUploadError: (err) => {
        setError(err.message || 'Upload failed');
        setUploading(false);
        setProgress(0);
      },
    }
  );

  const validate = (file: File) => {
    const okType = file.type.startsWith('image/');
    const okSize = file.size <= maxSizeMB * 1024 * 1024;
    if (!okType) return 'Only image files are allowed';
    if (!okSize) return `File must be under ${maxSizeMB} MB`;
    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const v = validate(file);
      if (v) {
        setError(v);
        return;
      }
      setError(null);
      setUploading(true);
      setProgress(0);
      await startUpload([file]);
    },
    [startUpload]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      await handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      const item = Array.from(e.clipboardData.items).find((i) =>
        i.type.startsWith('image/')
      );
      if (!item) return;
      const file = item.getAsFile();
      if (file)
        await handleFiles({
          0: file,
          length: 1,
          item: () => file,
        } as unknown as FileList);
    },
    [handleFiles]
  );

  const removeLogo = () => {
    setPreview(null);
    onChange(null);
    setError(null);
    setUploading(false);
    setProgress(0);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        className={cn(
          'group relative overflow-hidden rounded-2xl border border-border/60 bg-background/70 p-4 backdrop-blur',
          'transition-all',
          dragActive ? 'ring-2 ring-primary/60' : 'hover:border-primary/40'
        )}
      >
        {/* Gradient frame */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-70" />

        {!preview && !uploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-gradient-to-br from-muted/20 to-transparent px-6 py-10 text-center outline-none transition hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl checkerboard">
              <UploadCloud className="h-6 w-6 opacity-80" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Drag and drop your logo</p>
              <p className="text-xs text-muted-foreground">{helperText}</p>
            </div>
            <div className="mt-2">
              <Button variant="secondary" size="sm" className="gap-2" asChild>
                <div>
                  <ImageUp className="h-4 w-4" />
                  Choose file
                </div>
              </Button>
            </div>
          </button>
        )}

        {uploading && (
          <div className="relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-gradient-to-br from-muted/20 to-transparent px-6 py-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm font-medium">Uploading</p>
            <Progress value={progress} className="w-full max-w-xs" />
            <p className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {preview && !uploading && (
          <div className="relative flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-border checkerboard">
              <Image
                src={preview}
                alt="Logo preview"
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Logo ready</p>
              <p className="text-xs text-muted-foreground">
                Click Replace to try a different file
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeLogo}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <p className="text-[11px] text-muted-foreground">
        Tip: You can also paste an image from your clipboard
      </p>
    </div>
  );
}
