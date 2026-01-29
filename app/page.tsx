import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
        Smart Shareable Portfolio
      </h1>
      <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
        Create portfolios, get AI-generated insights, and share via secure links.
        Recipients can view breakdown, sector exposure, and risk — no signup
        required.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/signup"
          className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
