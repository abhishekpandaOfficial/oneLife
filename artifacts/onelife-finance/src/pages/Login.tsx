import React from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpenCheck,
  Brain,
  CalendarCheck2,
  CircleDollarSign,
  FileText,
  Fingerprint,
  Sparkles,
  Target,
} from "lucide-react";
import { AuthPanel } from "@/components/auth/AuthPanel";

const loginHighlights = [
  { label: "Finance", value: "₹299 Plus", icon: CircleDollarSign, color: "from-emerald-400 to-cyan-500" },
  { label: "Memory", value: "Timeline", icon: Brain, color: "from-fuchsia-400 to-blue-500" },
  { label: "Notes", value: "Daily OS", icon: FileText, color: "from-amber-300 to-orange-500" },
  { label: "Study", value: "14d streak", icon: BookOpenCheck, color: "from-sky-400 to-indigo-500" },
];

export default function Login() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#f7fafc] text-[#101828]">
      <div className="absolute inset-0 onelife-hero-grid" />
      <div className="absolute left-[-10rem] top-[-10rem] h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="absolute bottom-[-12rem] right-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/35 blur-3xl" />

      <div className="relative mx-auto grid min-h-[100dvh] max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <section className="hidden lg:block">
          <Link href="/" className="mb-7 inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-4 py-2 text-sm font-bold text-[#475467] shadow-sm backdrop-blur hover:text-[#101828]">
            <ArrowLeft className="h-4 w-4" />
            Back to OneLife
          </Link>

          <div className="mb-7 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white/80 px-3 py-1 text-sm font-extrabold text-cyan-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              OneLife secure access
            </div>
            <h1 className="text-5xl font-black leading-[1.02] tracking-normal xl:text-6xl">
              Enter your personal Life OS.
            </h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-[#667085]">
              Sign in once and move between finance, notes, memory, and study without breaking your flow.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_0.72fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-2 shadow-2xl onelife-live-visual">
              <img src="/onelife-lifeos-hero.png" alt="OneLife Life OS dashboard preview" className="aspect-[16/11] w-full rounded-[1.5rem] object-cover" />
              <div className="pointer-events-none absolute inset-2 rounded-[1.5rem] ring-1 ring-inset ring-white/70" />
              <div className="pointer-events-none absolute inset-2 rounded-[1.5rem] onelife-scanline" />
              <div className="pointer-events-none absolute left-[13%] top-[18%] h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.95)] onelife-pulse-dot" />
              <div className="pointer-events-none absolute right-[18%] top-[27%] h-2.5 w-2.5 rounded-full bg-fuchsia-300 shadow-[0_0_26px_rgba(217,70,239,0.8)] onelife-pulse-dot-delayed" />
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.75rem] border border-white bg-white/85 p-5 shadow-xl backdrop-blur onelife-login-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101828] text-white">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <p className="mt-6 text-sm font-extrabold uppercase text-[#667085]">Login mode</p>
                <p className="mt-1 text-2xl font-black">Google, Apple, OTP</p>
              </div>
              <div className="rounded-[1.75rem] border border-white bg-[#101828] p-5 text-white shadow-xl onelife-login-card-delayed">
                <CalendarCheck2 className="h-7 w-7 text-cyan-200" />
                <p className="mt-6 text-sm font-bold text-cyan-100">Tonight</p>
                <p className="mt-1 text-2xl font-black">Budget + study review</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">
            {loginHighlights.map((item) => (
              <div key={item.label} className="rounded-3xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur onelife-live-chip">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-bold text-[#667085]">{item.label}</p>
                <p className="text-sm font-black">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-md flex-col justify-center lg:max-w-[480px]">
          <Link href="/" className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white bg-white/80 px-4 py-2 text-sm font-bold text-[#475467] shadow-sm backdrop-blur hover:text-[#101828] lg:hidden">
            <ArrowLeft className="h-4 w-4" />
            Back to OneLife
          </Link>

          <div className="mb-4 grid grid-cols-3 gap-3 lg:hidden">
            {loginHighlights.slice(0, 3).map((item) => (
              <div key={item.label} className="rounded-2xl border border-white bg-white/80 p-3 text-center shadow-sm backdrop-blur onelife-live-chip">
                <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <p className="mt-2 truncate text-xs font-black">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="relative rounded-[2rem] border border-white bg-white/88 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="pointer-events-none absolute -right-4 -top-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-300 to-blue-500 text-white shadow-xl onelife-float">
              <Target className="h-7 w-7" />
            </div>
            <AuthPanel mode="page" />
          </div>
        </section>
      </div>
    </main>
  );
}
