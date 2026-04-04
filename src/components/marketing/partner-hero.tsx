"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PartnerHero() {
  return (
    <section className="relative min-h-[80vh] flex items-center pt-20 pb-16 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300">
            Партнёрская программа StudioSlow
          </span>

          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            Приводите клиентов.
            <br className="hidden sm:block" /> Получайте комиссию.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-300">
            Личный кабинет партнёра, прозрачный учёт лидов и выплат, быстрый старт без лишней
            бюрократии.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-emerald-400"
            >
              Стать партнёром
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white transition-all duration-300 hover:bg-white/10"
            >
              Войти по email
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

