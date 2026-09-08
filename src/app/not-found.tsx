"use client";
import { useI18n } from "@/i18n/provider";
import Link from "next/link";

export default function NotFound() {
  const { t: __tr } = useI18n();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">{__tr("Page not found")}</h1>
      <p>{__tr("The page may have moved or the address is incorrect.")}</p>
      <Link href="/" className="underline">
        {__tr("Return to home")}
      </Link>
    </main>
  );
}
