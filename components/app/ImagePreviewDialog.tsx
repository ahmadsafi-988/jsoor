"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ImagePreviewDialogProps = {
  src: string;
  alt: string;
  label: string;
  children: ReactNode;
  triggerClassName?: string;
};

export function ImagePreviewDialog({
  src,
  alt,
  label,
  children,
  triggerClassName,
}: ImagePreviewDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`View ${label}`}
          className={`border-0 bg-transparent p-0 ${triggerClassName ?? ""}`}
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-[min(92vw,900px)] [&>button]:right-1 [&>button]:top-1 [&>button]:rounded-full [&>button]:bg-black/35 [&>button]:p-2 [&>button]:text-white [&>button]:opacity-100 [&>button]:shadow-[0_2px_10px_rgba(0,0,0,0.35)] [&>button]:hover:bg-black/50 [&>button_svg]:h-5 [&>button_svg]:w-5">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <div className="flex max-h-[86vh] items-center justify-center rounded-xl bg-black/80 p-3">
          <img
            src={src}
            alt={alt}
            className="max-h-[80vh] max-w-full rounded-lg object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
