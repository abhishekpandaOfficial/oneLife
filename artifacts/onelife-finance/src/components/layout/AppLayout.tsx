import React, { useEffect, useState } from "react";
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
  Command,
  Database,
  ChevronLeft,
  ChevronRight
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

const navItems = [
  { label: "Dashboard",  href: "/",          icon: LayoutDashboard },
  { label: "Income",     href: "/income",     icon: ArrowDownToLine },
  { label: "Expenses",   href: "/expenses",   icon: ArrowUpFromLine },
  { label: "Transactions",href: "/transactions",icon: ArrowLeftRight },
  { label: "Loans",      href: "/loans",      icon: Wallet },
  { label: "Insurance",  href: "/insurance",  icon: ShieldCheck },
  { label: "Investments",href: "/investments",icon: TrendingUp },
  { label: "Goals",      href: "/goals",      icon: Target },
  { label: "Budget",     href: "/budget",     icon: PieChart },
  { label: "Reports",    href: "/reports",    icon: BarChart3 },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Settings",   href: "/settings",   icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<"connected" | "error" | "checking">("checking");
  
  // Collapsible sidebar state (persisted)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("onelife_sidebar_collapsed") === "true";
    }
    return false;
  });

  // Global search command menu states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Toggle sidebar collapse
  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("onelife_sidebar_collapsed", String(nextState));
    }
  };

  // Close mobile menu on navigate
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  // Probe DB connection status quietly every 30s
  useEffect(() => {
    const probe = async () => {
      try {
        const r = await fetch("/api/db/info");
        const data = await r.json();
        setDbStatus(data.status === "connected" ? "connected" : "error");
      } catch {
        setDbStatus("error");
      }
    };
    probe();
    const id = setInterval(probe, 30_000);
    return () => clearInterval(id);
  }, []);

  // Listen for Cmd+K / Ctrl+K to open global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search for transactions matching input
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsLoadingSearch(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/transactions?search=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
        }
      } catch (err) {
        console.error("Global search failed", err);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectNav = (href: string) => {
    setLocation(href);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

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
            {/* Sidebar Logo */}
            <div className="flex h-16 items-center px-4 border-b shrink-0">
              <Link href="/" className="flex items-center gap-2 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  OL
                </div>
                <span className={cn(
                  "text-xl font-bold tracking-tight transition-all duration-300",
                  isCollapsed ? "opacity-0 md:w-0" : "opacity-100"
                )}>
                  OneLife
                </span>
              </Link>
            </div>
            
            {/* Nav links */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                      isCollapsed ? "justify-center px-0 h-10" : "px-3",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className={cn(
                      "transition-all duration-300 truncate",
                      isCollapsed ? "opacity-0 md:w-0 hidden" : "opacity-100 block"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}

              {/* ── System Nav ────────────────────────────────────────── */}
              <div className="pt-4 pb-1 overflow-hidden">
                <p className={cn(
                  "px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 transition-all",
                  isCollapsed ? "opacity-0 hidden" : "opacity-100 block"
                )}>
                  System
                </p>
                {isCollapsed && <div className="h-px bg-border/50 mx-1 my-2" />}
              </div>
              {(() => {
                const isActive = location === "/database" || location.startsWith("/database");
                return (
                  <Link 
                    href="/database" 
                    title={isCollapsed ? "Database Monitor" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                      isCollapsed ? "justify-center px-0 h-10" : "px-3",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Database className="h-4 w-4 shrink-0" />
                    <span className={cn(
                      "flex-1 transition-all duration-300 truncate",
                      isCollapsed ? "opacity-0 md:w-0 hidden" : "opacity-100 block"
                    )}>
                      Database
                    </span>
                    <span className={cn(
                      "h-2 w-2 rounded-full ring-2 shrink-0 transition-all",
                      isCollapsed ? "absolute top-1 right-2" : "",
                      dbStatus === "connected"
                        ? "bg-emerald-500 ring-emerald-500/20"
                        : dbStatus === "error"
                        ? "bg-destructive ring-destructive/20"
                        : "bg-muted ring-muted/20 animate-pulse"
                    )} />
                  </Link>
                );
              })()}
            </div>
          </div>
          
          {/* Collapse sidebar controller & user profile */}
          <div className="border-t shrink-0">
            {/* Collapse toggle button */}
            <button 
              onClick={toggleCollapse}
              className="hidden md:flex w-full items-center justify-center h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 border-b transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Collapse Menu</span>
                </div>
              )}
            </button>

            {/* Profile */}
            <div className={cn(
              "flex items-center gap-3 py-3 px-3",
              isCollapsed ? "justify-center" : ""
            )}>
              <Avatar className="h-9 w-9 border-2 border-primary/10 shrink-0">
                <AvatarFallback className="bg-primary/5 text-primary font-semibold">CFO</AvatarFallback>
              </Avatar>
              <div className={cn(
                "flex flex-col transition-all duration-300 overflow-hidden",
                isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 block"
              )}>
                <span className="text-sm font-medium leading-none">CFOWorkspace</span>
                <span className="text-[10px] text-muted-foreground mt-1">Live Production</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Viewport Wrapper ────────────────────────────────────────── */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        isCollapsed ? "md:pl-16" : "md:pl-64"
      )}>
        
        {/* Header bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Dynamic Search Bar (Styled Trigger Button) */}
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
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
            </Button>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── Mobile backdrop overlay ─────────────────────────────────────── */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Functional Search Command Menu (Cmd+K) ───────────────────────── */}
      <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <CommandInput 
          placeholder="Search pages, transactions, etc..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoadingSearch ? "Searching database..." : "No results found."}
          </CommandEmpty>

          {/* Navigation group */}
          <CommandGroup heading="Quick Pages">
            {navItems
              .filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, 5)
              .map(item => (
                <CommandItem 
                  key={item.href} 
                  onSelect={() => handleSelectNav(item.href)}
                  className="cursor-pointer"
                >
                  <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Go to {item.label}</span>
                </CommandItem>
              ))}
            {searchQuery.toLowerCase().includes("database") && (
              <CommandItem onSelect={() => handleSelectNav("/database")} className="cursor-pointer">
                <Database className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Go to Database Monitor</span>
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* Database search results */}
          {searchResults && searchResults.length > 0 && (
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
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded font-mono">{tx.categoryName || "Uncategorized"}</span>
                  </div>
                  <span className={cn(
                    "font-mono text-xs font-semibold",
                    tx.type === "income" ? "text-emerald-500" : "text-destructive"
                  )}>
                    {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString()} INR
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
      
    </div>
  );
}