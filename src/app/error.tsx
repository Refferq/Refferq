"use client";
import { useI18n } from "@/i18n/provider";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t: __tr } = useI18n();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">
        {__tr("Unable to display this page")}
      </h1>
      <p>{__tr("Please try loading the page again.")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border px-4 py-2"
      >
        {__tr("Try again")}
      </button>
    </main>
  );
}
