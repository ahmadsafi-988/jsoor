"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createForumPost } from "@/lib/forums/actions";
import { createClient } from "@/lib/supabase/client";
import {
  FORUM_IMAGE_TYPES,
  FORUM_MEDIA_BUCKET,
  MAX_FORUM_IMAGES,
  MAX_FORUM_IMAGE_BYTES,
} from "@/lib/storage/forum-constants";

type SelectedImage = {
  file: File;
  previewUrl: string;
};

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}

export function NewForumPostClient({
  forumId,
  forumSlug,
  forumName,
  userId,
}: {
  forumId: string;
  forumSlug: string;
  forumName: string;
  userId: string;
}) {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addImages(files: FileList | null) {
    if (!files) return;
    setError(null);
    const next = [...images];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_FORUM_IMAGES) break;
      if (!FORUM_IMAGE_TYPES.includes(file.type)) {
        setError("Images must be JPEG, PNG, WebP, or GIF.");
        continue;
      }
      if (file.size > MAX_FORUM_IMAGE_BYTES) {
        setError("Each image must be 5MB or smaller.");
        continue;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setImages(next);
  }

  function removeImage(index: number) {
    setImages((current) => {
      URL.revokeObjectURL(current[index]?.previewUrl);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const paths: string[] = [];

      for (const image of images) {
        const path = `${userId}/posts/${crypto.randomUUID()}-${safeName(image.file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from(FORUM_MEDIA_BUCKET)
          .upload(path, image.file, { contentType: image.file.type });

        if (uploadError) {
          setError(uploadError.message);
          return;
        }
        paths.push(path);
      }

      formData.set("image_paths", JSON.stringify(paths));
      const result = await createForumPost(formData);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <form action={submit} className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-8 py-8">
      <input type="hidden" name="forum_id" value={forumId} />
      <input type="hidden" name="forum_slug" value={forumSlug} />
      <input type="hidden" name="image_paths" value="[]" />

      <div>
        <Link href={`/forums/${forumSlug}`} className="text-sm font-semibold text-[#006d43] hover:underline">
          Back to {forumName}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-[#1c1b1b]">Create Post</h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">Share a question, resource, or experience with this forum.</p>
      </div>

      <section className="space-y-5 rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
            Title
          </label>
          <input
            name="title"
            maxLength={160}
            required
            className="w-full rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006d43]/20"
            placeholder="What should other students know?"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
            Body
          </label>
          <textarea
            name="body"
            maxLength={8000}
            rows={9}
            className="w-full resize-y rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006d43]/20"
            placeholder="Write the post text. You can leave this empty only if you attach images."
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#1c1b1b]">Post anonymously</p>
            <p className="text-xs text-[#5f5e5e]">Other users will see Anonymous Job Seeker.</p>
          </div>
          <input name="is_anonymous" type="checkbox" className="h-4 w-4 accent-[#006d43]" />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
            Images
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#bccabe] bg-[#f6f3f2] px-4 py-8 text-center transition-colors hover:border-[#006d43]/40">
            <ImagePlus className="mb-2 h-7 w-7 text-[#006d43]" />
            <span className="text-sm font-semibold text-[#1c1b1b]">Add up to 5 images</span>
            <span className="mt-1 text-xs text-[#5f5e5e]">JPEG, PNG, WebP, or GIF. 5MB each.</span>
            <input type="file" multiple accept={FORUM_IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => addImages(event.target.files)} />
          </label>

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <div key={image.previewUrl} className="relative aspect-video overflow-hidden rounded-xl border border-[#e5e2e1]">
                  <img src={image.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-[#f0edec] pt-5">
          <Link
            href={`/forums/${forumSlug}`}
            className="rounded-xl border border-[#e5e2e1] px-4 py-2.5 text-sm font-semibold text-[#5f5e5e] hover:bg-[#f6f3f2]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#006d43] to-[#00a86b] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,109,67,0.15)] transition-all hover:brightness-110 disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Posting..." : "Publish Post"}
          </button>
        </div>
      </section>
    </form>
  );
}
