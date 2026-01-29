"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { PortfolioForm } from "@/components/portfolio-form";

export default function NewPortfolioPage() {
  const router = useRouter();

  async function handleSubmit(data: {
    title: string;
    privacy: string;
    cash: number;
    holdings: { ticker: string; quantity: number; buyPrice: number }[];
  }) {
    const res = await fetch("/api/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      throw new Error(j.error ?? "Failed to create");
    }
    const p = (await res.json()) as { id: string };
    router.push(`/portfolio/${p.id}`);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-semibold">Create portfolio</h1>
      <PortfolioForm submitLabel="Create" onSubmit={handleSubmit} />
    </main>
  );
}
