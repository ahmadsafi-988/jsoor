"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { createBlog, updateBlog } from "@/lib/blogs/actions";
import type { BlogRow } from "@/lib/blogs/data";

type BlogFormProps = {
  blog?: BlogRow;
};

export function BlogForm({ blog }: BlogFormProps) {
  const router = useRouter();
  const isEdit = !!blog;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = isEdit
        ? await updateBlog(blog.id, formData)
        : await createBlog(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="max-w-3xl w-full">
      <div className="mb-8">
        <Link
          href="/admin/blogs"
          className="inline-flex items-center gap-1.5 text-sm text-[#3d4a41] hover:text-[#006d43] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blogs
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">
          {isEdit ? "Edit Blog" : "New Blog"}
        </h1>
        <p className="text-neutral-500 text-sm">
          {isEdit
            ? "Update the public article details and content."
            : "Create a new public article for the landing page."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#e5e2e1] p-8 flex flex-col gap-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Title *</label>
          <input
            name="title"
            required
            defaultValue={blog?.title ?? ""}
            placeholder="e.g. 10 Essential Skills Every Graduate Needs"
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Slug</label>
            <input
              name="slug"
              defaultValue={blog?.slug ?? ""}
              placeholder="auto-generated from title"
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Category *</label>
            <input
              name="category"
              required
              defaultValue={blog?.category ?? "Career Tips"}
              placeholder="Career Tips"
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Excerpt *</label>
          <textarea
            name="excerpt"
            required
            rows={3}
            defaultValue={blog?.excerpt ?? ""}
            placeholder="Short summary shown on landing cards..."
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Image URL</label>
            <input
              name="image_url"
              type="url"
              defaultValue={blog?.image_url ?? ""}
              placeholder="https://..."
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1c1b1b]">Read Time</label>
            <input
              name="read_time"
              defaultValue={blog?.read_time ?? ""}
              placeholder="5 min read"
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Content *</label>
          <textarea
            name="content"
            required
            rows={12}
            defaultValue={blog?.content ?? ""}
            placeholder="Write the full blog content..."
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-y"
          />
        </div>

        <label className="flex items-center gap-3 rounded-xl bg-[#f6f3f2] border border-[#e5e2e1] px-4 py-3 text-sm text-[#3d4a41]">
          <input
            name="is_published"
            type="checkbox"
            defaultChecked={blog?.is_published ?? true}
            className="h-4 w-4 accent-[#006d43]"
          />
          Published and visible to visitors
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/admin/blogs")}
            className="px-5 py-2.5 rounded-xl border border-[#e5e2e1] text-sm font-medium text-[#3d4a41] hover:bg-[#f6f3f2] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#006d43] to-[#00a86b] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00a86b]/20 transition-all hover:brightness-110 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Blog"}
          </button>
        </div>
      </form>
    </div>
  );
}
