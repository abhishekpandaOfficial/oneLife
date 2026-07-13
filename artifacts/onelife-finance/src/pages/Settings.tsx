import React, { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import {
  User, Bell, Shield, Moon, Sun, LogOut,
  CheckCircle2, Save, RefreshCw, Lock, Palette, SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Prefs type ───────────────────────────────────────────────────────────────

interface UserPrefs {
  displayName: string;
  workspaceName: string;
  defaultCurrency: string;
  emailNotifications: boolean;
  billReminders: boolean;
  hideBalances: boolean;
}

const DEFAULT_PREFS: UserPrefs = {
  displayName: "Abhishek",
  workspaceName: "OneLife Finance",
  defaultCurrency: "INR",
  emailNotifications: true,
  billReminders: true,
  hideBalances: false,
};

const PREF_KEY = "onelife_user_prefs";

function loadPrefs(): UserPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PREFS };
}

function savePrefsLocal(prefs: UserPrefs) {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

const SECTIONS = ["Profile", "Appearance", "Preferences", "Security"] as const;
type Section = typeof SECTIONS[number];

const SECTION_ICONS: Record<Section, React.ElementType> = {
  Profile: User,
  Appearance: Palette,
  Preferences: SlidersHorizontal,
  Security: Shield,
};

const CURRENCIES = [
  { code: "INR", symbol: "₹",   label: "Indian Rupee" },
  { code: "USD", symbol: "$",   label: "US Dollar" },
  { code: "EUR", symbol: "€",   label: "Euro" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "SAR", symbol: "ر.س", label: "Saudi Riyal" },
  { code: "QAR", symbol: "ر.ق", label: "Qatari Riyal" },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<Section>("Profile");
  const [prefs, setPrefs] = useState<UserPrefs>(loadPrefs);
  const [draft, setDraft] = useState<UserPrefs>(loadPrefs);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    setIsDirty(JSON.stringify(draft) !== JSON.stringify(prefs));
  }, [draft, prefs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist to localStorage immediately
      savePrefsLocal(draft);
      setPrefs({ ...draft });

      // Notify AppLayout (same tab) to refresh display name
      window.dispatchEvent(new CustomEvent("onelife:prefs-updated"));

      // Attempt to persist to DB via a generic settings endpoint
      // (graceful fail — localStorage is the source of truth)
      try {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
      } catch {
        /* offline or endpoint not available — localStorage already saved */
      }

      toast({
        title: "✅ Settings saved",
        description: "Your preferences have been updated.",
      });
      setIsDirty(false);
    } catch (err) {
      toast({ title: "Failed to save", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft({ ...prefs });
    setIsDirty(false);
  };

  const set = <K extends keyof UserPrefs>(key: K, val: UserPrefs[K]) => {
    setDraft(d => ({ ...d, [key]: val }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account, appearance, and preferences.</p>
        </div>
        {isDirty && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/5 gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              Unsaved changes
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleReset}>Reset</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="flex flex-col gap-1">
          {SECTIONS.map((s) => {
            const Icon = SECTION_ICONS[s];
            return (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all",
                  activeSection === s
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {s}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 space-y-6">

          {/* ── Profile ── */}
          {activeSection === "Profile" && (
            <Card className="rounded-2xl border-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your personal information and workspace details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                        {draft.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{draft.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{draft.workspaceName}</p>
                    <Badge className="mt-1.5 bg-primary/10 text-primary border-primary/20 text-xs">Live Production</Badge>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={draft.displayName}
                      onChange={e => set("displayName", e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="workspaceName">Workspace Name</Label>
                    <Input
                      id="workspaceName"
                      value={draft.workspaceName}
                      onChange={e => set("workspaceName", e.target.value)}
                      placeholder="Workspace name"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving || !isDirty} className="gap-2">
                    {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {saving ? "Saving…" : "Save Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Appearance ── */}
          {activeSection === "Appearance" && (
            <Card className="rounded-2xl border-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how OneLife Finance looks on your device.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Color Theme</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        theme === "light" ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-card hover:bg-muted"
                      )}
                    >
                      <div className="w-full h-16 bg-[#f8fafc] rounded-lg border flex items-center justify-center shadow-inner">
                        <Sun className="text-orange-400 w-7 h-7" />
                      </div>
                      <span className="text-sm font-medium flex items-center gap-2">
                        Light {theme === "light" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </span>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        theme === "dark" ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-card hover:bg-muted"
                      )}
                    >
                      <div className="w-full h-16 bg-[#0f172a] rounded-lg border border-slate-700 flex items-center justify-center shadow-inner">
                        <Moon className="text-indigo-400 w-7 h-7" />
                      </div>
                      <span className="text-sm font-medium flex items-center gap-2">
                        Dark {theme === "dark" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </span>
                    </button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Default Currency</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CURRENCIES.map(c => (
                      <button
                        key={c.code}
                        onClick={() => set("defaultCurrency", c.code)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left",
                          draft.defaultCurrency === c.code
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border hover:border-primary/30 hover:bg-muted"
                        )}
                      >
                        <span className="text-lg">{c.symbol}</span>
                        <div>
                          <p className="font-bold text-xs">{c.code}</p>
                          <p className="text-[10px] text-muted-foreground">{c.label}</p>
                        </div>
                        {draft.defaultCurrency === c.code && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving || !isDirty} className="gap-2">
                    {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {saving ? "Saving…" : "Save Appearance"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Preferences ── */}
          {activeSection === "Preferences" && (
            <Card className="rounded-2xl border-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Control notifications, reminders, and privacy settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    key: "emailNotifications" as const,
                    label: "Email Notifications",
                    desc: "Receive weekly financial summary reports via email.",
                  },
                  {
                    key: "billReminders" as const,
                    label: "Bill & EMI Reminders",
                    desc: "Get alerts 3 days before EMIs, insurance renewals, and loan dues.",
                  },
                  {
                    key: "hideBalances" as const,
                    label: "Hide Balances",
                    desc: "Blur all sensitive numbers on screen by default.",
                  },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{label}</Label>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={draft[key] as boolean}
                      onCheckedChange={val => set(key, val)}
                    />
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={saving || !isDirty} className="gap-2">
                    {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {saving ? "Saving…" : "Save Preferences"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Security ── */}
          {activeSection === "Security" && (
            <Card className="rounded-2xl border-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your session and account security.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-emerald-500/5 border-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Session Active</p>
                    <p className="text-xs text-muted-foreground">Your session is secured via HTTPS and Supabase authentication.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border p-4">
                  <Lock className="h-8 w-8 text-primary/60 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Database Connection</p>
                    <p className="text-xs text-muted-foreground">Connected to Supabase PostgreSQL via encrypted SSL (ap-south-1).</p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="text-sm font-medium text-destructive">Danger Zone</p>
                    <p className="text-xs text-muted-foreground">Sign out of this session.</p>
                  </div>
                  <Button variant="destructive" className="gap-2 rounded-full">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}