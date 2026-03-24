"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { navGroups } from "@/components/nav-items";

const allItems = navGroups.flatMap((g) => g.items);

function getPageContent(href: string) {
  const item = allItems.find((i) => i.href === href);
  const label = item?.label ?? href;

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {label}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {href} — replace this placeholder with your real page content.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            <div className="mb-3 h-2 w-16 rounded-full bg-neutral-200" />
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-neutral-100" />
              <div className="h-2 w-4/5 rounded-full bg-neutral-100" />
              <div className="h-2 w-3/5 rounded-full bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [activePath, setActivePath] = useState("/");

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar activePath={activePath} onNavigate={setActivePath} />
      <main className="flex-1 overflow-y-auto">
        {getPageContent(activePath)}
      </main>
    </div>
  );
}