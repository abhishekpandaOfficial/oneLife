import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpenCheck,
  Brain,
  CalendarCheck2,
  CircleDollarSign,
  FileText,
  Fingerprint,
} from "lucide-react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { cn } from "@/lib/utils";

const loginHighlights = [
  { label: "Finance", value: "Net Worth", icon: CircleDollarSign, bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" },
  { label: "Memory", value: "Timeline", icon: Brain, bg: "bg-indigo-500/10 border-indigo-500/20", text: "text-indigo-400" },
  { label: "Notes", value: "Daily OS", icon: FileText, bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400" },
  { label: "Study", value: "14d streak", icon: BookOpenCheck, bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400" },
];

export default function Login() {
  return (
    <main className="min-h-[100dvh] flex bg-white text-slate-900 selection:bg-indigo-500/30">
      {/* Left Pane - Branding & Visuals */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-slate-900 overflow-hidden flex-col justify-between p-12 xl:p-16">
        <div className="absolute inset-0 onelife-hero-grid opacity-30 dark" />
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px]" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-slate-300 shadow-sm backdrop-blur-md transition-colors hover:bg-slate-700 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </Link>

          <div className="mt-20 max-w-lg">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-5xl">
              Your life's <span className="text-indigo-400">operating system.</span>
            </h1>
            <p className="mt-6 text-lg font-medium leading-relaxed text-slate-400">
              Finance, memory, notes, and study—unified in one secure, encrypted space. Sign in to continue your journey.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-16 max-w-2xl">
          <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative overflow-hidden rounded-[2rem] border border-slate-700/50 bg-slate-800/50 p-2 shadow-2xl backdrop-blur-sm"
            >
              <div className="overflow-hidden rounded-[1.5rem] bg-slate-900 ring-1 ring-white/10">
                <img src="/onelife-lifeos-hero.png" alt="Dashboard preview" className="w-full object-cover opacity-90" />
              </div>
            </motion.div>

            <div className="grid gap-4">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="rounded-[1.75rem] border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl backdrop-blur-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">Secure Access</p>
                <p className="mt-1 text-xl font-bold text-white">Biometric & OTP</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="rounded-[1.75rem] border border-indigo-500/20 bg-indigo-600/10 p-6 shadow-xl backdrop-blur-md"
              >
                <CalendarCheck2 className="h-7 w-7 text-indigo-400" />
                <p className="mt-6 text-xs font-bold uppercase tracking-wider text-indigo-300">Tonight</p>
                <p className="mt-1 text-xl font-bold text-white">Budget review</p>
              </motion.div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-4 grid grid-cols-4 gap-4"
          >
            {loginHighlights.map((item) => (
              <div key={item.label} className={cn("rounded-2xl border p-4 backdrop-blur-md", item.bg)}>
                <item.icon className={cn("h-6 w-6 mb-4", item.text)} />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Pane - Auth Panel */}
      <div className="relative flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 xl:w-[45%] lg:px-12 xl:px-24 bg-slate-50">
        <Link href="/" className="absolute top-8 left-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-200">
            <AuthPanel mode="page" />
          </div>
        </motion.div>
      </div>
    </main>
  );
}
