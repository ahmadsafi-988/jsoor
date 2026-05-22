"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { deleteBlog } from "@/lib/blogs/actions";
import type { BlogRow } from "@/lib/blogs/data";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminBlogsClient({ blogs }: { blogs: BlogRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; error?: string } | null>(null);

  function handleDelete(blog: BlogRow) {
    if (!confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;
    setFeedback(null);
    setDeletingId(blog.id);
    startTransition(async () => {
      const result = await deleteBlog(blog.id);
      if (result?.error) setFeedback({ id: blog.id, error: result.error });
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50">
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Title</th>
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Category</th>
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Status</th>
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Updated</th>
            <th className="text-right px-5 py-3 font-semibold text-neutral-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {blogs.map((blog) => {
            const isDeleting = deletingId === blog.id && isPending;
            return (
              <tr key={blog.id}>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-neutral-900 max-w-md truncate">{blog.title}</p>
                  <p className="text-xs text-neutral-400 max-w-md truncate">/{blog.slug}</p>
                </td>
                <td className="px-5 py-3.5 text-neutral-600">{blog.category}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      blog.is_published
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {blog.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-neutral-500">
                  {formatDate(blog.updated_at)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {feedback?.id === blog.id && feedback.error && (
                    <span className="mr-2 text-xs text-red-600">
                      <AlertTriangle className="inline h-3 w-3" /> {feedback.error}
                    </span>
                  )}
                  <div className="inline-flex items-center gap-1">
                    {blog.is_published && (
                      <Link
                        href={`/blog/${blog.slug}`}
                        className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-[#006d43] transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    )}
                    <Link
                      href={`/admin/blogs/${blog.id}`}
                      className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-[#006d43] transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(blog)}
                      disabled={isDeleting}
                      className="p-2 rounded-lg text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {blogs.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-12 text-center text-neutral-400">
                No blogs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
