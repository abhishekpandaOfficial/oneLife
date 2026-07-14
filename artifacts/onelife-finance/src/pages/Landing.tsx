import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  LockKeyhole
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
    name: "Finance",
    href: "/app",
    icon: CircleDollarSign,
    color: "from-emerald-400 to-teal-500",
    shadow: "shadow-emerald-500/20",
    text: "Budgets, goals, loans, cards, investments, reports, and live currency views.",
  },
  {
    name: "Memory",
    href: "#memory",
    icon: Brain,
    color: "from-indigo-400 to-violet-500",
    shadow: "shadow-indigo-500/20",
    text: "Capture people, moments, documents, places, and decisions in one searchable timeline.",
  },
  {
    name: "Notes",
    href: "#notes",
    icon: FileText,
    color: "from-amber-400 to-orange-500",
    shadow: "shadow-orange-500/20",
    text: "Fast notes, linked tasks, private journals, checklists, and daily planning.",
  },
  {
    name: "Study",
    href: "#study",
    icon: GraduationCap,
    color: "from-blue-400 to-cyan-500",
    shadow: "shadow-blue-500/20",
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nav = (
    <>
      <a href="#products" className="transition-colors hover:text-indigo-600">Products</a>
      <a href="#dashboard" className="transition-colors hover:text-indigo-600">Dashboard</a>
      <a href="#pricing" className="transition-colors hover:text-indigo-600">Pricing</a>
    </>
  );

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-slate-50 text-slate-900 selection:bg-indigo-500/30">
      <header className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-3 shadow-sm" : "bg-transparent py-5"
      )}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-slate-900/5 transition-transform group-hover:scale-105">
              <img src="/onelife-logo.svg" alt="OneLife logo" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none tracking-tight text-slate-900">OneLife</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            {nav}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <button className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900" onClick={() => setAuthOpen(true)}>
              Log in
            </button>
            <Button className="rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-600 hover:shadow-indigo-500/25" onClick={() => setAuthOpen(true)}>
              Start free trial
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((open) => !open)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
        
        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 bg-white px-6 md:hidden"
            >
              <nav className="flex flex-col gap-4 py-6 text-base font-semibold text-slate-600" onClick={() => setMobileOpen(false)}>
                {nav}
                <div className="my-2 h-px w-full bg-slate-100" />
                <button className="text-left font-semibold text-slate-900" onClick={() => setAuthOpen(true)}>Log in</button>
                <Button className="mt-2 w-full rounded-xl bg-indigo-600 py-6 text-base text-white" onClick={() => setAuthOpen(true)}>
                  Start free trial
                </Button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 -z-10 onelife-hero-grid opacity-60" />
        
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
        
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-[1fr_1fr] lg:gap-8 xl:gap-16 items-center">
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-2xl"
            >
              <motion.div variants={fadeUp}>
                <Badge className="mb-6 rounded-full border-indigo-200/50 bg-indigo-50/50 px-4 py-1.5 text-sm font-semibold text-indigo-700 backdrop-blur-md">
                  <Stars className="mr-2 h-4 w-4 text-indigo-500" />
                  Your entire life, organized in one place
                </Badge>
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-[4rem]">
                The <span className="text-indigo-600">private command center</span> for your life.
              </motion.h1>
              
              <motion.p variants={fadeUp} className="mt-6 text-lg font-medium leading-relaxed text-slate-600 text-balance lg:text-xl">
                OneLife brings your finances, memories, notes, and studies into a single, beautifully crafted system. Stop switching between fragmented apps.
              </motion.p>
              
              <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button className="group h-14 rounded-full bg-slate-900 px-8 text-base font-semibold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-500/30" onClick={() => setAuthOpen(true)}>
                  Start your 7-day trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Link href="/app">
                  <Button variant="outline" className="h-14 w-full rounded-full border-slate-200 bg-white px-8 text-base font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 sm:w-auto">
                    <LayoutDashboard className="mr-2 h-5 w-5 text-slate-400" />
                    Preview dashboard
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-12 flex items-center gap-6 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-5 w-5 text-slate-400" />
                  <span>End-to-end encrypted</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative lg:ml-auto w-full max-w-[600px]"
            >
              {/* Floating detail cards */}
              <div className="absolute -left-12 top-20 z-10 hidden animate-float-slow rounded-2xl border border-white/60 bg-white/80 p-4 shadow-xl backdrop-blur-xl md:block">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <CircleDollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Worth</p>
                    <p className="text-lg font-extrabold text-slate-900">₹14,50,000</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-8 bottom-32 z-10 hidden animate-float-delayed rounded-2xl border border-white/60 bg-white/80 p-4 shadow-xl backdrop-blur-xl md:block">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memory Added</p>
                    <p className="text-sm font-extrabold text-slate-900">Paris Trip 2023</p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-[2rem] border border-slate-200/50 bg-white p-2 shadow-2xl shadow-slate-200/50 onelife-live-visual">
                <div className="overflow-hidden rounded-[1.5rem] bg-slate-100 ring-1 ring-slate-900/5">
                  <img src="/onelife-lifeos-hero.png" alt="OneLife Dashboard Preview" className="w-full object-cover" />
                  <div className="absolute inset-0 rounded-[1.5rem] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] pointer-events-none" />
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      <section id="products" className="relative border-t border-slate-200/50 bg-white py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-3xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600">The Four Pillars</h2>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything you care about, thoughtfully integrated.
            </p>
            <p className="mt-4 text-lg text-slate-600">
              OneLife isn't a collection of separate tools. It's a single, cohesive environment where your finances, notes, learning, and memories live together.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => (
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                key={product.name}
                href={product.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50"
              >
                <div className={cn("mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", product.color, product.shadow)}>
                  <product.icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{product.name}</h3>
                <p className="mt-3 flex-1 text-sm font-medium leading-relaxed text-slate-600">{product.text}</p>
                <div className="mt-8 flex items-center font-semibold text-indigo-600">
                  <span>Explore module</span>
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section id="dashboard" className="bg-slate-900 py-24 text-white lg:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 rounded-full border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-300 backdrop-blur-md">
                <Flame className="mr-2 h-4 w-4 text-orange-400" />
                The Daily Pulse
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl leading-[1.1]">
                A dashboard that understands your day.
              </h2>
              <p className="mt-6 text-lg text-slate-400 leading-relaxed">
                Start your morning with a clear overview of your financial health, upcoming study sessions, pending tasks, and recent memories. It's the ultimate personal homepage.
              </p>
              
              <ul className="mt-10 space-y-4">
                {[
                  "Intelligent daily summaries",
                  "Cross-module insights",
                  "Privacy-first architecture",
                  "Beautiful responsive design"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-2xl rounded-full opacity-50" />
              <div className="relative rounded-3xl border border-slate-700/50 bg-slate-800/50 p-2 backdrop-blur-xl shadow-2xl">
                <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr]">
                  <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-sm">
                    <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Timeline</p>
                        <h3 className="text-xl font-bold mt-1">Today's Flow</h3>
                      </div>
                      <Stars className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div className="space-y-4">
                      {timeline.map(([time, title, detail], i) => (
                        <div key={time} className="flex gap-4">
                          <span className="font-mono text-sm font-bold text-slate-400 pt-0.5">{time}</span>
                          <div className="flex-1 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                            <p className="text-sm font-bold text-slate-900">{title}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed">{detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-sm relative overflow-hidden">
                      <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                        <CircleDollarSign className="w-32 h-32" />
                      </div>
                      <div className="relative z-10">
                        <CircleDollarSign className="h-8 w-8 text-indigo-200" />
                        <p className="mt-8 text-sm font-bold text-indigo-100">Financial Health</p>
                        <p className="text-4xl font-extrabold mt-1 tracking-tight">Excellent</p>
                      </div>
                    </div>
                    <div className="flex-1 rounded-2xl bg-slate-700 p-6 text-white shadow-sm border border-slate-600">
                      <BookOpenCheck className="h-8 w-8 text-emerald-400" />
                      <p className="mt-8 text-sm font-bold text-slate-400">Study Streak</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-4xl font-extrabold tracking-tight">14</p>
                        <span className="text-slate-400 font-medium">days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      <section id="pricing" className="bg-slate-50 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600">Pricing</h2>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Simple plans for a complex life.
            </p>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                key={plan.name} 
                className={cn(
                  "relative flex flex-col rounded-3xl p-8 transition-all",
                  plan.featured 
                    ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20 scale-105 z-10 border border-slate-800" 
                    : "bg-white text-slate-900 border border-slate-200 shadow-sm"
                )}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="rounded-full bg-indigo-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <h3 className={cn("text-xl font-bold", plan.featured ? "text-white" : "text-slate-900")}>{plan.name}</h3>
                
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className={cn("text-sm font-medium", plan.featured ? "text-slate-400" : "text-slate-500")}>/{plan.note}</span>
                </div>
                <p className={cn("mt-2 text-sm font-medium", plan.featured ? "text-slate-400" : "text-slate-500")}>{plan.usd} USD equivalent</p>
                
                <div className="mt-8 flex-1 space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className={cn("h-5 w-5 shrink-0", plan.featured ? "text-indigo-400" : "text-indigo-600")} />
                      <span className={cn("text-sm font-medium", plan.featured ? "text-slate-300" : "text-slate-600")}>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className={cn(
                    "mt-10 h-14 w-full rounded-xl text-base font-semibold transition-all", 
                    plan.featured 
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-md" 
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                  )} 
                  onClick={() => setAuthOpen(true)}
                >
                  Get started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 overflow-hidden border-t border-slate-200">
        <div className="absolute inset-0 bg-indigo-600" />
        {/* Abstract decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] rounded-full bg-indigo-500 blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] rounded-full bg-purple-600 blur-3xl opacity-50 pointer-events-none" />
        
        <div className="relative mx-auto max-w-4xl px-6 text-center text-white">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Ready to organize your life?
          </h2>
          <p className="mt-6 text-xl text-indigo-100 font-medium">
            Join OneLife today and experience the clarity of a unified personal operating system.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button className="h-14 rounded-full bg-white px-8 text-base font-bold text-indigo-600 shadow-xl transition-all hover:bg-indigo-50 hover:scale-105" onClick={() => setAuthOpen(true)}>
              Start 7-day free trial
            </Button>
          </div>
          <p className="mt-6 text-sm text-indigo-200 font-medium">No credit card required. Setup takes 2 minutes.</p>
        </div>
      </section>

      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-sm font-medium text-slate-400 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <img src="/onelife-logo.svg" alt="OneLife" className="h-5 w-5" />
            </div>
            <span className="font-bold text-white tracking-tight">OneLife OS</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link href="/app" className="hover:text-white transition-colors">Dashboard</Link>
            <a href="#products" className="hover:text-white transition-colors">Products</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <button className="hover:text-white transition-colors" onClick={() => setAuthOpen(true)}>Log in</button>
          </div>
          <div className="text-slate-500">
            &copy; {new Date().getFullYear()} OneLife. All rights reserved.
          </div>
        </div>
      </footer>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="rounded-3xl border-0 bg-white p-1 shadow-2xl sm:max-w-[440px] overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Sign in to OneLife</DialogTitle>
            <DialogDescription>Use Google, Apple, or mobile OTP to sign in.</DialogDescription>
          </DialogHeader>
          <div className="bg-white p-8">
            <AuthPanel />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
