import React from "react";
import { useTheme } from "@/hooks/use-theme";
import { User, Bell, Shield, Moon, Sun, Monitor, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar Nav (Static for layout) */}
        <div className="hidden md:flex flex-col gap-1 pr-4">
          <Button variant="secondary" className="justify-start font-medium bg-muted">
            <User className="mr-2 w-4 h-4" /> Profile
          </Button>
          <Button variant="ghost" className="justify-start font-medium text-muted-foreground">
            <Bell className="mr-2 w-4 h-4" /> Notifications
          </Button>
          <Button variant="ghost" className="justify-start font-medium text-muted-foreground">
            <Shield className="mr-2 w-4 h-4" /> Security
          </Button>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card className="rounded-2xl border-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information and workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">JD</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">John Doe</h3>
                  <p className="text-sm text-muted-foreground">john.cfo@example.com</p>
                  <Button variant="outline" size="sm" className="mt-3">Change Avatar</Button>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <div className="p-2 border rounded-md bg-muted/30 text-sm font-medium">John Doe</div>
                </div>
                <div className="space-y-1.5">
                  <Label>Workspace Name</Label>
                  <div className="p-2 border rounded-md bg-muted/30 text-sm font-medium">CFO Workspace</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how OneLife looks on your device.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <button 
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-transparent bg-card hover:bg-muted'}`}
                >
                  <div className="w-full h-16 bg-[#f8fafc] rounded-md border flex items-center justify-center shadow-inner">
                    <Sun className="text-orange-500 w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium flex items-center gap-2">
                    Light {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </span>
                </button>

                <button 
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-transparent bg-card hover:bg-muted'}`}
                >
                  <div className="w-full h-16 bg-[#0f172a] rounded-md border flex items-center justify-center shadow-inner">
                    <Moon className="text-indigo-400 w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium flex items-center gap-2">
                    Dark {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Manage application settings and defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive weekly summary reports.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Bill Reminders</Label>
                  <p className="text-sm text-muted-foreground">Alert 3 days before EMIs and renewals.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Hide Balances</Label>
                  <p className="text-sm text-muted-foreground">Blur sensitive numbers by default.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button variant="destructive" className="rounded-full">
              <LogOut className="mr-2 w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}