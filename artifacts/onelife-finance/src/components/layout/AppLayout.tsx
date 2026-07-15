import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Target,
  PieChart,
  BarChart3,
  Tags,
  Settings,
  Menu,
  Bell,
  Search,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  GitBranch,
  LogOut,
  CreditCard,
  BriefcaseBusiness,
  Users,
  Notebook,
  Lightbulb,
  Plane,
  ChevronDown,
  Circle,
  FileText,
  Building2,
  Folder,
  Handshake,
  MapPinned,
  BadgeIndianRupee,
  HeartPulse,
  UserRound,
  Stethoscope,
  Pill,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

const PREF_KEY = "onelife_user_prefs";

function readDisplayName(): string {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.displayName || "User";
    }
  } catch { /* ignore */ }
  return "Abhishek";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  exact?: boolean;
};

const navModules: Array<{
  id: string;
  label: string;
  os: string;
  icon: React.ElementType;
  accent: string;
  items: NavItem[];
}> = [
  {
    id: "finance",
    label: "OneFinance",
    os: "MoneyOS",
    icon: Wallet,
    accent: "text-emerald-600 dark:text-emerald-300",
    items: [
      { label: "Dashboard", href: "/onefinance", icon: LayoutDashboard, exact: true },
      { label: "Income", href: "/income", icon: ArrowDownToLine },
      { label: "Expenses", href: "/expenses", icon: ArrowUpFromLine },
      { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
      { label: "Loans", href: "/loans", icon: Wallet },
      { label: "Credit Cards", href: "/credit-cards", icon: CreditCard },
      { label: "Insurance", href: "/insurance", icon: ShieldCheck },
      { label: "Investments", href: "/investments", icon: TrendingUp },
      { label: "Goals", href: "/goals", icon: Target },
      { label: "Budget", href: "/budget", icon: PieChart },
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Categories", href: "/categories", icon: Tags },
    ],
  },
  {
    id: "work",
    label: "OneWork",
    os: "CareerOS",
    icon: BriefcaseBusiness,
    accent: "text-blue-600 dark:text-blue-300",
    items: [
      { label: "Dashboard", href: "/onework", icon: LayoutDashboard, exact: true },
      { label: "Career Workspace", href: "/onework/career", icon: BriefcaseBusiness, exact: true },
      { label: "Companies", href: "/onework/companies", icon: Building2, exact: true },
      { label: "Documents", href: "/onework/documents", icon: Folder, exact: true },
      { label: "PF Ledger", href: "/onework/pf", icon: BadgeIndianRupee, exact: true },
    ],
  },
  {
    id: "social",
    label: "OneSocial",
    os: "RelationshipOS",
    icon: Users,
    accent: "text-rose-600 dark:text-rose-300",
    items: [
      { label: "Dashboard", href: "/onesocial", icon: LayoutDashboard, exact: true },
      { label: "Content", href: "/onesocial/workspace", icon: FileText, exact: true },
      { label: "Workflow", href: "/onesocial/workflow", icon: GitBranch, exact: true },
      { label: "People", href: "/onesocial/people", icon: Users, exact: true },
      { label: "Circles", href: "/onesocial/circles", icon: Circle, exact: true },
      { label: "Follow-ups", href: "/onesocial/follow-ups", icon: Handshake, exact: true },
      { label: "Calendar", href: "/onesocial/calendar", icon: CalendarDays, exact: true },
      { label: "Analytics", href: "/onesocial/analytics", icon: BarChart3, exact: true },
      { label: "Settings", href: "/onesocial/settings", icon: Settings, exact: true },
    ],
  },
  {
    id: "health",
    label: "OneHealth",
    os: "HealthOS",
    icon: HeartPulse,
    accent: "text-red-600 dark:text-red-300",
    items: [
      { label: "Dashboard", href: "/onehealth", icon: LayoutDashboard, exact: true },
      { label: "Family Members", href: "/onehealth/members", icon: UserRound, exact: true },
      { label: "Health Records", href: "/onehealth/records", icon: Stethoscope, exact: true },
      { label: "Medicines", href: "/onehealth/medicines", icon: Pill, exact: true },
      { label: "Appointments", href: "/onehealth/appointments", icon: CalendarDays, exact: true },
    ],
  },
  {
    id: "note",
    label: "OneNote",
    os: "KnowledgeOS",
    icon: Notebook,
    accent: "text-amber-600 dark:text-amber-300",
    items: [
      { label: "Dashboard", href: "/onenote", icon: LayoutDashboard, exact: true },
      { label: "Notes", href: "/onenote/notes", icon: Notebook, exact: true },
      { label: "Collections", href: "/onenote/collections", icon: Folder, exact: true },
      { label: "Resources", href: "/onenote/resources", icon: FileText, exact: true },
    ],
  },
  {
    id: "idea",
    label: "OneIdea",
    os: "CreationOS",
    icon: Lightbulb,
    accent: "text-fuchsia-600 dark:text-fuchsia-300",
    items: [
      { label: "Dashboard", href: "/oneidea", icon: LayoutDashboard, exact: true },
      { label: "Ideas", href: "/oneidea/ideas", icon: Lightbulb, exact: true },
      { label: "Experiments", href: "/oneidea/experiments", icon: Zap, exact: true },
      { label: "Roadmap", href: "/oneidea/roadmap", icon: Target, exact: true },
    ],
  },
  {
    id: "travel",
    label: "OneTravel",
    os: "TravelOS",
    icon: Plane,
    accent: "text-cyan-600 dark:text-cyan-300",
    items: [
      { label: "Dashboard", href: "/onetravel", icon: LayoutDashboard, exact: true },
      { label: "Trips", href: "/onetravel/trips", icon: Plane, exact: true },
      { label: "Places", href: "/onetravel/places", icon: MapPinned, exact: true },
      { label: "Travel Docs", href: "/onetravel/documents", icon: FileText, exact: true },
    ],
  },
];

const dashboardItem: NavItem = { label: "One Dashboard", href: "/app", icon: LayoutDashboard, exact: true };
const settingsItem: NavItem = { label: "Settings", href: "/settings", icon: Settings, exact: true };
const searchableNavItems = [dashboardItem, ...navModules.flatMap((module) => module.items), settingsItem];
const MODULE_PREF_KEY = "onelife_sidebar_open_modules";

function isRouteActive(location: string, item: Pick<NavItem, "href" | "exact">) {
  return item.exact ? location === item.href : location === item.href || location.startsWith(`${item.href}/`);
}

function readOpenModules(): Record<string, boolean> {
  const defaults = {
    finance: true,
    work: true,
    social: false,
    health: false,
    note: false,
    idea: false,
    travel: false,
  };
  try {
    const raw = localStorage.getItem(MODULE_PREF_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<"connected" | "error" | "checking">("checking");
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(readOpenModules);

  // Display name — re-reads from localStorage whenever settings are saved
  const [displayName, setDisplayName] = useState<string>(readDisplayName);

  // Collapsible sidebar state (persisted)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("onelife_sidebar_collapsed") === "true";
    }
    return false;
  });

  // Profile dropdown open state
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Global search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Toggle sidebar collapse
  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("onelife_sidebar_collapsed", String(next));
  };

  // Close mobile menu on navigate
  useEffect(() => { setIsMobileOpen(false); }, [location]);

  // Listen for prefs updates (same tab: custom event; other tab: storage event)
  useEffect(() => {
    const refresh = () => setDisplayName(readDisplayName());
    window.addEventListener("onelife:prefs-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("onelife:prefs-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  // Probe DB connection every 30s
  useEffect(() => {
    const probe = async () => {
      try {
        const r = await fetch("/api/db/info");
        const data = await r.json();
        setDbStatus(data.status === "connected" ? "connected" : "error");
      } catch { setDbStatus("error"); }
    };
    probe();
    const id = setInterval(probe, 30_000);
    return () => clearInterval(id);
  }, []);

  // Cmd+K search shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    setIsLoadingSearch(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/transactions?search=${encodeURIComponent(searchQuery)}`);
        if (res.ok) setSearchResults((await res.json()) || []);
      } catch { /* ignore */ }
      finally { setIsLoadingSearch(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSelectNav = (href: string) => {
    setLocation(href);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const toggleModule = (id: string) => {
    setOpenModules((current) => {
      const next = { ...current, [id]: !current[id] };
      localStorage.setItem(MODULE_PREF_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isDbActive  = location === "/database"    || location.startsWith("/database");
  const isApiActive = location === "/api-monitor" || location.startsWith("/api-monitor");
  const initials    = getInitials(displayName);

  return (
    <div className="flex min-h-[100dvh] w-full bg-background/50">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 bg-card border-r transition-all duration-300 ease-in-out flex flex-col md:translate-x-0",
        isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
        isCollapsed ? "md:w-16" : "md:w-64"
      )}>
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col flex-1 min-h-0">

            {/* Logo */}
            <div className="flex h-16 items-center px-4 border-b shrink-0">
              <Link href="/" className="flex items-center gap-2 overflow-hidden">
                <svg
                  className="h-9 w-9 shrink-0 rounded-xl"
                  viewBox="0 0 256 256"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="OneLife"
                >
                  <defs>
                    <linearGradient id="onelifeLogoRing" x1="46" y1="194" x2="210" y2="62" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#20D6E7" />
                      <stop offset="0.22" stopColor="#19D69D" />
                      <stop offset="0.43" stopColor="#FFD048" />
                      <stop offset="0.62" stopColor="#FF5A2A" />
                      <stop offset="0.79" stopColor="#EA3DF7" />
                      <stop offset="1" stopColor="#355DFF" />
                    </linearGradient>
                    <linearGradient id="onelifeLogoPerson" x1="128" y1="102" x2="128" y2="203" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#69E9FF" />
                      <stop offset="1" stopColor="#0BBBD6" />
                    </linearGradient>
                    <filter id="onelifeLogoShadow" x="18" y="18" width="220" height="224" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                      <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#07111F" floodOpacity="0.28" />
                    </filter>
                  </defs>
                  <rect width="256" height="256" rx="56" fill="#0B1220" />
                  <g filter="url(#onelifeLogoShadow)">
                    <path d="M128 31C74.428 31 31 74.428 31 128C31 181.572 74.428 225 128 225C181.572 225 225 181.572 225 128C225 74.428 181.572 31 128 31ZM128 77C156.167 77 179 99.833 179 128C179 156.167 156.167 179 128 179C99.833 179 77 156.167 77 128C77 99.833 99.833 77 128 77Z" fill="url(#onelifeLogoRing)" />
                    <path d="M56 137C62 188 102 213 128 213C154 213 194 188 200 137C189 165 162 185 128 185C94 185 67 165 56 137Z" fill="#0B1220" fillOpacity="0.18" />
                    <circle cx="128" cy="109" r="22" fill="url(#onelifeLogoPerson)" />
                    <path d="M82 201C87.818 169.661 104.97 151 128 151C151.03 151 168.182 169.661 174 201C160.75 208.618 145.391 213 128 213C110.609 213 95.25 208.618 82 201Z" fill="url(#onelifeLogoPerson)" />
                    <path d="M55 128C55 87.683 87.683 55 128 55C151.39 55 172.211 66.002 185.572 83.115" stroke="white" strokeOpacity="0.28" strokeWidth="8" strokeLinecap="round" />
                    <path d="M75 189C88.4 202.007 106.695 210 128 210C169.974 210 204 175.974 204 134" stroke="#6FF7FF" strokeOpacity="0.24" strokeWidth="8" strokeLinecap="round" />
                  </g>
                </svg>
                <span className={cn(
                  "text-xl font-bold tracking-tight transition-all duration-300",
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}>
                  OneLife
                </span>
              </Link>
            </div>

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
              <Link
                href={dashboardItem.href}
                title={isCollapsed ? dashboardItem.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2.5 text-sm font-semibold transition-all duration-150",
                  isCollapsed ? "justify-center px-2 h-10" : "px-3",
                  location === dashboardItem.href
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <dashboardItem.icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{dashboardItem.label}</span>}
              </Link>

              {!isCollapsed && (
                <div className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Ecosystem
                </div>
              )}

              {navModules.map((module) => {
                const isModuleActive = module.items.some((item) => isRouteActive(location, item));
                const isOpen = Boolean(openModules[module.id]);
                return (
                  <div key={module.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => isCollapsed ? setLocation(module.items[0].href) : toggleModule(module.id)}
                      title={isCollapsed ? module.label : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-semibold transition-all duration-150",
                        isCollapsed ? "justify-center px-2 h-10" : "px-3",
                        isModuleActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <module.icon className={cn("h-4 w-4 shrink-0", !isModuleActive && module.accent)} />
                      {!isCollapsed && (
                        <>
                          <span className="flex min-w-0 flex-1 items-baseline gap-2 text-left">
                            <span className="truncate">{module.label}</span>
                            <span className="truncate text-[10px] font-semibold text-muted-foreground">{module.os}</span>
                          </span>
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen ? "rotate-0" : "-rotate-90")} />
                        </>
                      )}
                    </button>

                    {!isCollapsed && isOpen && (
                      <div className="ml-3 space-y-0.5 border-l border-border/70 pl-3">
                        {module.items.map((item) => {
                          const isActive = isRouteActive(location, item);
                          return (
                            <Link
                              key={`${module.id}-${item.label}-${item.href}`}
                              href={item.href}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <item.icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <Link
                href={settingsItem.href}
                title={isCollapsed ? settingsItem.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-150",
                  isCollapsed ? "justify-center px-2 h-10" : "px-3",
                  location === settingsItem.href
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <settingsItem.icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{settingsItem.label}</span>}
              </Link>

              {/* System section */}
              <div className="pt-3 pb-1">
                {isCollapsed
                  ? <div className="h-px bg-border/50 mx-1 my-2" />
                  : <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">System</p>
                }
              </div>

              {/* Database Monitor */}
              <Link
                href="/database"
                title={isCollapsed ? "Database Monitor" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-150",
                  isCollapsed ? "justify-center px-2 h-10" : "px-3",
                  isDbActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Database className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="flex-1 truncate">Database</span>}
                <span className={cn(
                  "h-2 w-2 rounded-full ring-2 shrink-0",
                  dbStatus === "connected"
                    ? "bg-emerald-500 ring-emerald-500/20 animate-pulse"
                    : dbStatus === "error"
                    ? "bg-red-500 ring-red-500/20"
                    : "bg-yellow-400 ring-yellow-400/20 animate-pulse"
                )} />
              </Link>

              {/* API Monitor */}
              <Link
                href="/api-monitor"
                title={isCollapsed ? "API Monitor" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-150",
                  isCollapsed ? "justify-center px-2 h-10" : "px-3",
                  isApiActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Zap className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="flex-1 truncate">API Monitor</span>}
              </Link>
            </div>
          </div>

          {/* Bottom — collapse toggle + profile */}
          <div className="border-t shrink-0">

            {/* Collapse toggle — icon only */}
            <button
              onClick={toggleCollapse}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden md:flex w-full items-center justify-center h-10 border-b text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {isCollapsed
                ? <PanelLeftOpen  className="h-4 w-4" />
                : <PanelLeftClose className="h-4 w-4" />
              }
            </button>

            {/* Profile — clickable, shows dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                title="Account"
                className={cn(
                  "w-full flex items-center gap-2.5 py-3 px-3 hover:bg-muted/50 transition-colors rounded-b-none",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                {/* Avatar with blinking green dot only */}
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {dbStatus === "connected" && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card animate-pulse" />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 flex-1 text-left">
                    <span className="text-sm font-semibold leading-none truncate">{displayName}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 truncate">Account</span>
                  </div>
                )}
              </button>

              {/* Profile dropdown */}
              {profileOpen && (
                <div className={cn(
                  "absolute z-50 bottom-full mb-1 bg-card border rounded-xl shadow-xl overflow-hidden py-1",
                  isCollapsed ? "left-14 w-44" : "left-2 right-2"
                )}>
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground">OneLife Ecosystem</p>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); setLocation("/settings"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </button>
                  <div className="border-t" />
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      localStorage.removeItem(PREF_KEY);
                      window.location.reload();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        isCollapsed ? "md:pl-16" : "md:pl-64"
      )}>
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileOpen(!isMobileOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="h-9 w-64 rounded-lg border border-input bg-muted/30 hover:bg-muted/50 px-3 text-sm text-muted-foreground flex items-center justify-between outline-none transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 opacity-70" />
                <span>Search everywhere...</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground bg-background border px-1.5 py-0.5 rounded shadow-sm">
                <span className="text-[10px]">⌘</span>K
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Cmd+K Search Dialog */}
      <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <CommandInput
          placeholder="Search pages, transactions…"
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>{isLoadingSearch ? "Searching…" : "No results found."}</CommandEmpty>
          <CommandGroup heading="Quick Pages">
            {searchableNavItems
              .filter((i) => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, 8)
              .map((i) => (
                <CommandItem key={i.href} onSelect={() => handleSelectNav(i.href)} className="cursor-pointer">
                  <i.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Go to {i.label}</span>
                </CommandItem>
              ))}
            {searchQuery.toLowerCase().includes("database") && (
              <CommandItem onSelect={() => handleSelectNav("/database")} className="cursor-pointer">
                <Database className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Go to Database Monitor</span>
              </CommandItem>
            )}
            {searchQuery.toLowerCase().includes("api") && (
              <CommandItem onSelect={() => handleSelectNav("/api-monitor")} className="cursor-pointer">
                <Zap className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Go to API Monitor</span>
              </CommandItem>
            )}
          </CommandGroup>

          {searchResults.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Transactions Found">
                {searchResults.map((tx) => (
                  <CommandItem
                    key={tx.id}
                    onSelect={() => handleSelectNav(`/transactions/${tx.id}/edit`)}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        tx.type === "income" ? "bg-emerald-500" : "bg-destructive"
                      )} />
                      <span className="font-medium truncate max-w-[200px]">{tx.description}</span>
                    </div>
                    <span className={cn(
                      "font-mono text-xs font-semibold",
                      tx.type === "income" ? "text-emerald-500" : "text-destructive"
                    )}>
                      {tx.type === "income" ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN")}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
