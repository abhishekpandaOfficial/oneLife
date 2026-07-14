import React, { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  Check,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  Stars,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { cn } from "@/lib/utils";

const products = [
  {
    name: "OneLife Finance",
    href: "/app",
    icon: CircleDollarSign,
    color: "from-emerald-400 to-cyan-500",
    text: "Budgets, goals, loans, cards, investments, reports, and live currency views.",
  },
  {
    name: "OneLife Memory",
    href: "#memory",
    icon: Brain,
    color: "from-fuchsia-400 to-blue-500",
    text: "Capture people, moments, documents, places, and decisions in one searchable timeline.",
  },
  {
    name: "OneLife Notes",
    href: "#notes",
    icon: FileText,
    color: "from-amber-300 to-orange-500",
    text: "Fast notes, linked tasks, private journals, checklists, and daily planning.",
  },
  {
    name: "OneLife Study",
    href: "#study",
    icon: GraduationCap,
    color: "from-sky-400 to-indigo-500",
    text: "Courses, spaced revision, focus sessions, assignments, and exam progress.",
  },
];

const timeline = [
  ["07:30", "Plan day", "Study block, EMI reminder, travel memory backup"],
  ["12:15", "Money check", "Lunch expense auto-categorized under Food"],
  ["18:40", "Remember", "New family photo saved to Memory timeline"],
  ["22:00", "Reflect", "Daily note summarized into tomorrow's focus list"],
];

const pricing = [
  {
    name: "Try Free",
    price: "₹0",
    usd: "$0",
    note: "7 days",
    features: ["Full Life OS preview", "Mobile OTP login", "Finance dashboard sample", "Private workspace"],
  },
  {
    name: "OneLife Plus",
    price: "₹299",
    usd: "~$3.59",
    note: "per month",
    featured: true,
    features: ["Finance, Notes, Memory", "Smart dashboards", "Google and Apple login", "Secure encrypted login"],
  },
  {
    name: "OneLife Ultra",
    price: "₹499",
    usd: "~$5.99",
    note: "per month",
    features: ["Everything in Plus", "Study OS", "Advanced reports", "Priority feature access"],
  },
];

export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <>
      <a href="#products">Products</a>
      <a href="#dashboard">Dashboard</a>
      <a href="#pricing">Pricing</a>
      <Link href="/login">Login</Link>
    </>
  );

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f8fbff] text-[#101828]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/onelife-logo.svg" alt="OneLife logo" className="h-11 w-11 rounded-2xl shadow-lg" />
            <div>
              <p className="text-lg font-extrabold leading-none tracking-normal">OneLife</p>
              <p className="text-xs font-semibold text-[#667085]">Life OS</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#475467] md:flex">
            {nav}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" className="rounded-full" onClick={() => setAuthOpen(true)}>
              Sign in
            </Button>
            <Button className="rounded-full bg-[#111827] px-5 text-white hover:bg-[#0b1220]" onClick={() => setAuthOpen(true)}>
              Try free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((open) => !open)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileOpen && (
          <div className="border-t bg-white px-5 py-4 md:hidden">
            <nav className="grid gap-3 text-sm font-semibold text-[#475467]" onClick={() => setMobileOpen(false)}>
              {nav}
            </nav>
            <Button className="mt-4 w-full rounded-full bg-[#111827] text-white" onClick={() => setAuthOpen(true)}>
              Try free for 7 days
            </Button>
          </div>
        )}
      </header>

      <section className="relative pt-28 lg:pt-32">
        <div className="absolute inset-0 -z-10 onelife-hero-grid" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-[0.92fr_1.08fr] lg:pb-20">
          <div>
            <Badge className="mb-5 rounded-full border-cyan-200 bg-white/80 px-3 py-1 text-[#176b87] shadow-sm" variant="outline">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-cyan-500" />
              Finance, memory, notes, and study in one private Life OS
            </Badge>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-normal text-[#101828] sm:text-6xl lg:text-7xl">
              Organize your whole life with OneLife.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#475467]">
              OneLife brings money, memories, notes, learning, routines, and personal decisions into a calm dashboard built for real individual life management.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="h-13 rounded-full bg-[#111827] px-7 text-base font-bold text-white shadow-xl hover:bg-[#0b1220]" onClick={() => setAuthOpen(true)}>
                Try free for 7 days
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link href="/app">
                <Button variant="outline" className="h-13 w-full rounded-full border-[#d0d5dd] bg-white px-7 text-base font-bold sm:w-auto">
                  <LayoutDashboard className="mr-2 h-5 w-5 text-cyan-500" />
                  Open dashboard
                </Button>
              </Link>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              {["7 day free trial", "₹299 Plus", "₹499 Ultra"].map((item) => (
                <div key={item} className="rounded-2xl border border-white bg-white/75 px-3 py-4 text-center text-sm font-bold shadow-sm backdrop-blur">
                  <Check className="mx-auto mb-2 h-4 w-4 text-emerald-500" />
                  <span className="font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[
                { label: "Money", value: "+12.4%", icon: CircleDollarSign, color: "text-emerald-500 bg-emerald-50" },
                { label: "Notes", value: "24", icon: FileText, color: "text-orange-500 bg-orange-50" },
                { label: "Study", value: "14d", icon: GraduationCap, color: "text-blue-500 bg-blue-50" },
              ].map((item) => (
                <div key={item.label} className="flex min-w-0 items-center gap-2 rounded-2xl border border-white bg-white/80 px-3 py-3 shadow-sm backdrop-blur onelife-live-chip">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", item.color)}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-bold text-[#667085]">{item.label}</span>
                    <span className="block truncate text-sm font-black text-[#101828]">{item.value}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-4 hidden rounded-3xl border border-white bg-white/90 p-4 shadow-xl lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold">Secure Auth</p>
                  <p className="text-xs font-semibold text-[#667085]">Google, Apple, OTP</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-2 shadow-2xl onelife-live-visual">
              <img src="/onelife-lifeos-hero.png" alt="OneLife Life OS animated dashboard preview" className="aspect-[16/11] w-full rounded-[1.5rem] object-cover" />
              <div className="pointer-events-none absolute inset-2 rounded-[1.5rem] ring-1 ring-inset ring-white/70" />
              <div className="pointer-events-none absolute inset-2 rounded-[1.5rem] onelife-scanline" />
              <div className="pointer-events-none absolute left-[12%] top-[16%] h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.95)] onelife-pulse-dot" />
              <div className="pointer-events-none absolute right-[18%] top-[28%] h-2.5 w-2.5 rounded-full bg-fuchsia-300 shadow-[0_0_26px_rgba(217,70,239,0.8)] onelife-pulse-dot-delayed" />
              <div className="pointer-events-none absolute bottom-[18%] left-[46%] h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_26px_rgba(52,211,153,0.85)] onelife-pulse-dot" />
            </div>
            <div className="mt-4 rounded-3xl border border-white bg-[#101828] p-4 text-white shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-cyan-200">Tonight</p>
                  <p className="mt-1 text-lg font-black">Study + budget review</p>
                </div>
                <div className="flex items-center gap-2">
                  {[Brain, CircleDollarSign, GraduationCap].map((Icon, index) => (
                    <span key={index} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-cyan-100">
                      <Icon className="h-4 w-4" />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-extrabold uppercase text-cyan-600">The Life OS grid</p>
            <h2 className="mt-2 text-3xl font-black tracking-normal sm:text-4xl">Four apps, one personal command center.</h2>
          </div>
          <p className="max-w-xl text-base font-medium leading-7 text-[#667085]">
            Jump between money, memory, notes, and study without losing context. The same profile, same navigation, same calm design.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product, index) => (
            <a
              key={product.name}
              href={product.href}
              className="group relative min-h-[260px] overflow-hidden rounded-[1.75rem] border border-white bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className={cn("mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", product.color)}>
                <product.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-black tracking-normal">{product.name}</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-[#667085]">{product.text}</p>
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#101828]">Explore</span>
                <ChevronRight className="h-5 w-5 text-[#98a2b3] transition group-hover:translate-x-1 group-hover:text-[#101828]" />
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="dashboard" className="bg-[#101828] py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge className="rounded-full border-white/10 bg-white/10 px-3 py-1 text-cyan-100" variant="outline">
              <Flame className="mr-2 h-3.5 w-3.5 text-amber-300" />
              Animated dashboard
            </Badge>
            <h2 className="mt-5 text-3xl font-black tracking-normal sm:text-5xl">A daily dashboard that feels alive but stays focused.</h2>
            <p className="mt-5 text-base font-medium leading-8 text-slate-300">
              OneLife turns your day into a readable system: finance health, notes, study streaks, memories, and next actions in one responsive workspace.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Encrypted auth", "Responsive navbars", "Smart product grid", "INR + USD pricing"].map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm font-bold">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
              <div className="rounded-[1.5rem] bg-white p-5 text-[#101828]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-[#667085]">Today</p>
                    <h3 className="text-xl font-black">Life Pulse</h3>
                  </div>
                  <Stars className="h-6 w-6 text-fuchsia-500" />
                </div>
                <div className="space-y-3">
                  {timeline.map(([time, title, detail]) => (
                    <div key={time} className="grid grid-cols-[54px_1fr] gap-3 rounded-2xl border border-[#eaecf0] bg-[#f9fafb] p-3">
                      <span className="font-mono text-xs font-bold text-cyan-600">{time}</span>
                      <div>
                        <p className="text-sm font-black">{title}</p>
                        <p className="mt-1 text-xs font-medium leading-5 text-[#667085]">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                <div className="rounded-[1.5rem] bg-gradient-to-br from-cyan-400 to-blue-600 p-5 text-white">
                  <CircleDollarSign className="h-7 w-7" />
                  <p className="mt-7 text-sm font-bold text-cyan-50">Finance score</p>
                  <p className="text-4xl font-black">86%</p>
                </div>
                <div className="rounded-[1.5rem] bg-gradient-to-br from-amber-300 to-orange-500 p-5 text-[#111827]">
                  <BookOpenCheck className="h-7 w-7" />
                  <p className="mt-7 text-sm font-bold">Study streak</p>
                  <p className="text-4xl font-black">14d</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-sm font-extrabold uppercase text-cyan-600">Simple pricing</p>
          <h2 className="mt-2 text-3xl font-black tracking-normal sm:text-4xl">Start free, upgrade when OneLife becomes your daily system.</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {pricing.map((plan) => (
            <div key={plan.name} className={cn("relative rounded-[1.75rem] border bg-white p-6 shadow-sm", plan.featured ? "border-[#101828] shadow-2xl" : "border-white")}>
              {plan.featured && (
                <Badge className="absolute right-5 top-5 rounded-full bg-[#101828] text-white">Popular</Badge>
              )}
              <h3 className="text-xl font-black">{plan.name}</h3>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-5xl font-black tracking-normal">{plan.price}</span>
                <span className="pb-2 text-sm font-bold text-[#667085]">{plan.note}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#667085]">{plan.usd} USD equivalent</p>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm font-semibold">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {feature}
                  </div>
                ))}
              </div>
              <Button className={cn("mt-7 h-12 w-full rounded-full", plan.featured ? "bg-[#101828] text-white hover:bg-[#0b1220]" : "bg-[#eef7ff] text-[#101828] hover:bg-[#e0f2fe]")} onClick={() => setAuthOpen(true)}>
                Start {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="grid gap-5 rounded-[2rem] bg-[#101828] p-6 text-white md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <h2 className="text-3xl font-black tracking-normal">Build your personal operating system today.</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-300">
              Try OneLife free for 7 days, then choose Plus or Ultra when you are ready to organize life properly.
            </p>
          </div>
          <Button className="h-12 rounded-full bg-white px-7 font-black text-[#101828] hover:bg-cyan-50" onClick={() => setAuthOpen(true)}>
            <Play className="mr-2 h-4 w-4" />
            Try free
          </Button>
        </div>
      </section>

      <footer className="border-t bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 text-sm font-semibold text-[#667085] md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <img src="/onelife-logo.svg" alt="OneLife" className="h-9 w-9 rounded-xl" />
            <span>OneLife Life OS</span>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="/app">Dashboard</Link>
            <a href="#products">Products</a>
            <a href="#pricing">Pricing</a>
            <button className="font-semibold" onClick={() => setAuthOpen(true)}>Login</button>
          </div>
        </div>
      </footer>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="rounded-[2rem] border-white bg-white p-6 shadow-2xl sm:max-w-[480px]">
          <DialogHeader className="sr-only">
            <DialogTitle>Sign in to OneLife</DialogTitle>
            <DialogDescription>Use Google, Apple, or mobile OTP to sign in.</DialogDescription>
          </DialogHeader>
          <AuthPanel />
        </DialogContent>
      </Dialog>
    </main>
  );
}
