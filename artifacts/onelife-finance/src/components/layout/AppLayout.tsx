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
  Command
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Income", href: "/income", icon: ArrowDownToLine },
  { label: "Expenses", href: "/expenses", icon: ArrowUpFromLine },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Loans", href: "/loans", icon: Wallet },
  { label: "Insurance", href: "/insurance", icon: ShieldCheck },
  { label: "Investments", href: "/investments", icon: TrendingUp },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Budget", href: "/budget", icon: PieChart },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu on navigate
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  return (
    <div className="flex min-h-[100dvh] w-full bg-background/50">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform duration-300 ease-in-out md:translate-x-0 md:static",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-6 border-b">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                OL
              </div>
              <span className="text-xl font-bold tracking-tight">OneLife</span>
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <Avatar className="h-9 w-9 border-2 border-primary/10">
                <AvatarFallback className="bg-primary/5 text-primary font-medium">JD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">John Doe</span>
                <span className="text-xs text-muted-foreground mt-1">CFO Workspace</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
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
            
            <div className="hidden sm:flex items-center relative">
              <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search everywhere..." 
                className="h-9 w-64 rounded-md border border-input bg-muted/50 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                <Command className="h-3 w-3" /> K
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
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
    </div>
  );
}