import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  ExternalLink,
  FileText,
  Flame,
  GitBranch,
  Globe2,
  Hash,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Newspaper,
  PenLine,
  Plus,
  RadioTower,
  RefreshCw,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link, useLocation } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type SocialContent = {
  id: number;
  campaignId: number | null;
  title: string;
  summary: string | null;
  body: string;
  status: string;
  approvalStatus: string;
  contentType: string;
  audience: string | null;
  cta: string | null;
  topics: string | null;
  tags: string | null;
  series: string | null;
  slug: string | null;
  aiSummary: string | null;
  keywords: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SocialCampaign = {
  id: number;
  name: string;
  theme: string;
  status: string;
  objective: string | null;
  color: string;
};

type PlatformVersion = {
  id: number;
  contentId: number;
  platform: string;
  title: string;
  body: string;
  status: string;
  characterCount: number;
  hashtags: string | null;
};

type QueueItem = {
  id: number;
  contentId: number;
  platformVersionId: number | null;
  platform: string;
  status: string;
  scheduledAt: string;
  attempts: number;
  lastError: string | null;
};

type Connector = {
  id: number;
  platform: string;
  tier: number;
  status: string;
  health: string;
  accountName: string | null;
  username: string | null;
  authType: string;
  credentialStatus: string;
  credentialUpdatedAt: string | null;
  lastCheckedAt: string | null;
  lastError: string | null;
  notes: string | null;
};

type Hashtag = {
  id: number;
  hashtag: string;
  category: string;
  platform: string;
  popularity: number;
  usageCount: number;
  performanceScore: number;
  trendingScore: number;
};

type AiSuggestion = {
  id: number;
  title: string;
  suggestionType: string;
  priority: string;
  description: string;
  status: string;
};

type SocialAnalytics = {
  id: number;
  contentId: number | null;
  platform: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  followersDelta: number;
  measuredAt: string;
};

type ActivityRow = {
  id: number;
  eventType: string;
  message: string;
  actor: string;
  createdAt: string;
};

type SocialPerson = {
  id: number;
  name: string;
  role: string | null;
  company: string | null;
  platform: string;
  handle: string | null;
  relationshipStage: string;
  notes: string | null;
  lastContactedAt: string | null;
};

type SocialCircle = {
  id: number;
  name: string;
  purpose: string | null;
  color: string;
  cadence: string;
  memberCount: number;
};

type SocialFollowup = {
  id: number;
  personId: number | null;
  circleId: number | null;
  title: string;
  channel: string;
  status: string;
  dueAt: string;
  notes: string | null;
};

type AutomationRule = {
  id: number;
  name: string;
  triggerType: string;
  triggerConfig: string;
  actionType: string;
  actionConfig: string;
  status: string;
  lastRunAt: string | null;
};

type SocialSummary = {
  campaigns: SocialCampaign[];
  content: SocialContent[];
  platformVersions: PlatformVersion[];
  queue: QueueItem[];
  connectors: Connector[];
  hashtags: Hashtag[];
  analytics: SocialAnalytics[];
  suggestions: AiSuggestion[];
  activity: ActivityRow[];
  people: SocialPerson[];
  circles: SocialCircle[];
  followups: SocialFollowup[];
  automationRules: AutomationRule[];
  metrics: {
    todayScheduled: number;
    drafts: number;
    publishedToday: number;
    postsThisWeek: number;
    postsThisMonth: number;
    followersGrowth: number;
    engagementRate: number;
    bestPlatform: string;
    topPost: string;
    pendingReviews: number;
    publishingErrors: number;
    connectedPlatforms: number;
    totalViews: number;
    dueFollowups: number;
    activeAutomations: number;
  };
  pipeline: Array<{ stage: string; count: number }>;
  platformLabels: Record<string, string>;
};

const lifecycleLabels: Record<string, string> = {
  idea: "Idea",
  research: "Research",
  draft: "Draft",
  ai_enhancement: "AI Enhancement",
  review: "Review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  analytics: "Analytics",
  repurpose: "Repurpose",
  archived: "Archive",
};

const contentTypes = [
  ["linkedin_post", "LinkedIn Post"],
  ["linkedin_article", "LinkedIn Article"],
  ["substack_newsletter", "Substack Newsletter"],
  ["medium_article", "Medium Article"],
  ["twitter_thread", "Twitter Thread"],
  ["twitter_post", "Twitter Post"],
  ["instagram_caption", "Instagram Caption"],
  ["product_announcement", "Product Announcement"],
  ["technical_article", "Technical Article"],
  ["career_post", "Career Post"],
  ["case_study", "Case Study"],
];

const platformOptions = [
  ["linkedin_post", "LinkedIn Post"],
  ["linkedin_article", "LinkedIn Article"],
  ["substack", "Substack"],
  ["medium", "Medium"],
  ["twitter", "Twitter/X"],
  ["instagram", "Instagram"],
];

const socialSections = [
  ["dashboard", "/onesocial", LayoutDashboard, "Dashboard"],
  ["workspace", "/onesocial/workspace", FileText, "Content"],
  ["workflow", "/onesocial/workflow", GitBranch, "Workflow"],
  ["people", "/onesocial/people", Users, "People"],
  ["circles", "/onesocial/circles", Target, "Circles"],
  ["follow-ups", "/onesocial/follow-ups", Handshake, "Follow-ups"],
  ["calendar", "/onesocial/calendar", CalendarDays, "Calendar"],
  ["analytics", "/onesocial/analytics", BarChart3, "Analytics"],
  ["settings", "/onesocial/settings", Wifi, "Settings"],
] as const;

const platformBrand: Record<string, { label: string; mark: string; color: string; bg: string }> = {
  linkedin_post: { label: "LinkedIn", mark: "in", color: "#0a66c2", bg: "#e8f3ff" },
  linkedin_article: { label: "LinkedIn", mark: "in", color: "#0a66c2", bg: "#e8f3ff" },
  "LinkedIn Posts": { label: "LinkedIn", mark: "in", color: "#0a66c2", bg: "#e8f3ff" },
  "LinkedIn Articles": { label: "LinkedIn", mark: "in", color: "#0a66c2", bg: "#e8f3ff" },
  substack: { label: "Substack", mark: "S", color: "#ff6719", bg: "#fff1e8" },
  Substack: { label: "Substack", mark: "S", color: "#ff6719", bg: "#fff1e8" },
  medium: { label: "Medium", mark: "M", color: "#111827", bg: "#f3f4f6" },
  Medium: { label: "Medium", mark: "M", color: "#111827", bg: "#f3f4f6" },
  twitter: { label: "X", mark: "X", color: "#111827", bg: "#f3f4f6" },
  "Twitter/X": { label: "X", mark: "X", color: "#111827", bg: "#f3f4f6" },
  instagram: { label: "Instagram", mark: "IG", color: "#c13584", bg: "#fce7f3" },
  Instagram: { label: "Instagram", mark: "IG", color: "#c13584", bg: "#fce7f3" },
};

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(body?.message || body?.error || "Request failed");
  return body as T;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not set";
  return format(parseISO(value), "dd MMM, h:mm a");
}

function percent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

export default function OneSocial() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [summary, setSummary] = useState<SocialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState<"content" | "schedule" | null>(null);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const section = location.split("/")[2] || "dashboard";

  const load = async () => {
    setIsLoading(true);
    try {
      setSummary(await apiRequest<SocialSummary>("/api/onesocial/summary"));
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Could not load OneSocial", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedContentId && summary?.content[0]) setSelectedContentId(summary.content[0].id);
  }, [selectedContentId, summary?.content]);

  const selectedContent = summary?.content.find((item) => item.id === selectedContentId) ?? summary?.content[0] ?? null;
  const selectedVersions = selectedContent ? summary?.platformVersions.filter((version) => version.contentId === selectedContent.id) ?? [] : [];
  const filteredContent = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!summary) return [];
    if (!normalized) return summary.content;
    return summary.content.filter((item) =>
      [item.title, item.summary, item.body, item.topics, item.tags, item.audience].some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [searchTerm, summary]);

  const mutate = async (action: () => Promise<unknown>, success: string) => {
    setIsSaving(true);
    try {
      await action();
      toast({ title: success });
      await load();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Action failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !summary) {
    return (
      <div className="space-y-6 pb-12">
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28 rounded-2xl" />)}</div>
        <Skeleton className="h-[560px] rounded-2xl" />
      </div>
    );
  }

  if (!summary) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-8">
          <h1 className="text-xl font-semibold">OneSocial could not load</h1>
          <p className="mt-2 text-muted-foreground">Please check the API server and database connection.</p>
        </CardContent>
      </Card>
    );
  }

  const healthScore = Math.round(
    (summary.connectors.filter((connector) => connector.health === "healthy").length / Math.max(1, summary.connectors.length)) * 100,
  );
  const aiReadiness = Math.min(100, 30 + summary.content.length * 10 + summary.platformVersions.length * 4 + summary.hashtags.length * 2);
  const activeCampaigns = summary.campaigns.filter((campaign) => campaign.status === "active").length;
  const connectedConnectors = summary.connectors.filter((connector) => connector.status === "connected");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <section className="overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-card via-card to-cyan-500/10">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_400px] lg:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-background">ContentOS</Badge>
              <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> AI adaptation live</Badge>
              <Badge variant="outline" className="bg-background">Tier 1: LinkedIn + Substack</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">OneSocial Enterprise AI Content Operating System</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Create one master idea, adapt it for every channel, route it through review, schedule publishing, monitor connector health, and learn from analytics.
            </p>
            <div className="mt-5 grid max-w-4xl gap-3 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search content, topics, tags, audience..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setDialog("content")}><Plus className="mr-2 h-4 w-4" /> Content</Button>
                <Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-background/75 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Operating Health</p>
                <p className="mt-2 font-mono text-4xl font-bold">{healthScore}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Connector health plus publishing readiness.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <RadioTower className="h-6 w-6" />
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <MiniStat label="Content" value={String(summary.content.length)} />
              <MiniStat label="Campaigns" value={String(activeCampaigns)} />
              <MiniStat label="AI Ready" value={`${aiReadiness}%`} />
            </div>
          </div>
        </div>
      </section>

      <Card>
        <CardContent className="flex gap-2 overflow-x-auto p-2">
          {socialSections.map(([value, href, Icon, label]) => (
            <Link key={value} href={href}>
              <Button variant={section === value ? "default" : "ghost"} size="sm" className="shrink-0 gap-2">
                <Icon className="h-4 w-4" /> {label}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Connected Platforms" value={`${summary.metrics.connectedPlatforms}/${summary.connectors.length}`} icon={Wifi} tone="text-emerald-600" />
        <MetricCard title="Post Views" value={String(summary.metrics.totalViews)} icon={BarChart3} tone="text-blue-600" />
        <MetricCard title="Today Scheduled" value={String(summary.metrics.todayScheduled)} icon={CalendarDays} tone="text-blue-600" />
        <MetricCard title="Drafts" value={String(summary.metrics.drafts)} icon={PenLine} tone="text-cyan-600" />
        <MetricCard title="Published Today" value={String(summary.metrics.publishedToday)} icon={Send} tone="text-emerald-600" />
        <MetricCard title="Posts This Week" value={String(summary.metrics.postsThisWeek)} icon={Newspaper} tone="text-violet-600" />
        <MetricCard title="Posts This Month" value={String(summary.metrics.postsThisMonth)} icon={FileText} tone="text-indigo-600" />
        <MetricCard title="Followers Growth" value={`+${summary.metrics.followersGrowth}`} icon={TrendingUp} tone="text-lime-600" />
        <MetricCard title="Engagement Rate" value={percent(summary.metrics.engagementRate)} icon={BarChart3} tone="text-pink-600" />
        <MetricCard title="Pending Reviews" value={String(summary.metrics.pendingReviews)} icon={ShieldCheck} tone="text-amber-600" />
        <MetricCard title="Due Follow-ups" value={String(summary.metrics.dueFollowups)} icon={Handshake} tone="text-rose-600" />
        <MetricCard title="Active Automations" value={String(summary.metrics.activeAutomations)} icon={Zap} tone="text-orange-600" />
      </div>

      {section === "people" && <PeopleSection people={summary.people} />}
      {section === "circles" && <CirclesSection circles={summary.circles} />}
      {section === "follow-ups" && <FollowupsSection followups={summary.followups} people={summary.people} circles={summary.circles} />}
      {section === "workflow" && <WorkflowSection rules={summary.automationRules} queue={summary.queue} />}
      {section === "settings" && <SettingsSection connectors={summary.connectors} isSaving={isSaving} onConfigure={(id, data) => mutate(() => apiRequest(`/api/onesocial/connectors/${id}/configure`, { method: "POST", body: JSON.stringify(data) }), "Connection settings saved")} onCheck={(id) => mutate(() => apiRequest(`/api/onesocial/connectors/${id}/check`, { method: "POST", body: JSON.stringify({}) }), "Connection checked")} />}
      {section === "analytics" && <AnalyticsSection summary={summary} />}

      {(section === "dashboard" || section === "workspace" || section === "calendar") && <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> AI Command Center</CardTitle>
            <CardDescription>Suggestions, gaps, repurposing opportunities, and schedule intelligence from live content data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.suggestions.slice(0, 4).map((suggestion) => (
              <div key={suggestion.id} className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{suggestion.title}</p>
                    <Badge variant={suggestion.priority === "high" ? "default" : "outline"}>{suggestion.priority}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{suggestion.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Current Signal</CardTitle>
            <CardDescription>Top content and platform focus from analytics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs uppercase text-muted-foreground">Best Platform</p>
              <div className="mt-2 flex items-center gap-3">
                <PlatformLogo platform={summary.metrics.bestPlatform} size="lg" />
                <p className="text-2xl font-bold">{platformBrand[summary.metrics.bestPlatform]?.label || summary.metrics.bestPlatform}</p>
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase text-muted-foreground">Top Post</p>
              <p className="mt-1 font-medium">{summary.metrics.topPost}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Queue Errors" value={String(summary.metrics.publishingErrors)} />
              <MiniStat label="Hashtags" value={String(summary.hashtags.length)} />
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase text-muted-foreground">Connected</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {connectedConnectors.length === 0 ? <Badge variant="outline">No live platforms connected</Badge> : connectedConnectors.map((connector) => <PlatformPill key={connector.id} platform={connector.platform} />)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>}

      {(section === "dashboard" || section === "workspace" || section === "calendar") && <Tabs defaultValue={section === "calendar" ? "calendar" : "workspace"} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[680px]">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Content Pipeline</CardTitle>
                  <CardDescription>{filteredContent.length} master content items.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setDialog("content")}><Plus className="mr-2 h-4 w-4" /> New</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredContent.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full rounded-xl border p-3 text-left transition ${selectedContent?.id === item.id ? "border-primary/50 bg-primary/5" : "hover:border-primary/30"}`}
                    onClick={() => setSelectedContentId(item.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.summary || item.body}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">{item.contentType.replaceAll("_", " ")}</Badge>
                      {item.approvalStatus === "approved" && <Badge variant="secondary">approved</Badge>}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <ContentWorkspace
              content={selectedContent}
              versions={selectedVersions}
              isSaving={isSaving}
              onGenerate={() => selectedContent && mutate(() => apiRequest(`/api/onesocial/content/${selectedContent.id}/generate-platform-versions`, { method: "POST" }), "Platform versions generated")}
              onMove={(status) => selectedContent && mutate(() => apiRequest(`/api/onesocial/content/${selectedContent.id}`, { method: "PATCH", body: JSON.stringify({ status }) }), `Moved to ${lifecycleLabels[status]}`)}
              onSchedule={() => setDialog("schedule")}
            />
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Publishing Calendar</CardTitle>
                <CardDescription>Upcoming schedule, queue status, retry posture, and manual publishing control.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.queue.length === 0 ? (
                  <EmptyState icon={Clock3} title="No queued posts" description="Schedule a platform version from the workspace." />
                ) : (
                  summary.queue.map((item) => {
                    const content = summary.content.find((entry) => entry.id === item.contentId);
                    return (
                      <div key={item.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <PlatformPill platform={item.platform} />
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="mt-2 font-medium">{content?.title || "Untitled content"}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(item.scheduledAt)} · attempts {item.attempts}</p>
                        </div>
                        <Button size="sm" disabled={isSaving || item.status === "published"} onClick={() => mutate(() => apiRequest(`/api/onesocial/queue/${item.id}/run`, { method: "POST" }), "Queue item published")}>
                          <Rocket className="mr-2 h-4 w-4" /> Publish
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lifecycle Map</CardTitle>
                <CardDescription>Visual operating flow from idea to repurpose.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.pipeline.map((stage, index) => (
                  <div key={stage.stage} className="flex items-center gap-3 rounded-xl border p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-xs">{index + 1}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{lifecycleLabels[stage.stage] || stage.stage}</p>
                      <Progress className="mt-2 h-2" value={Math.min(100, stage.count * 25)} />
                    </div>
                    <Badge variant="outline">{stage.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Campaigns</CardTitle>
                <CardDescription>Campaign grouping across products, topics, and content series.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.campaigns.map((campaign) => {
                  const count = summary.content.filter((item) => item.campaignId === campaign.id).length;
                  return (
                    <div key={campaign.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">{campaign.objective || campaign.theme}</p>
                        </div>
                        <Badge style={{ backgroundColor: `${campaign.color}18`, color: campaign.color }}>{campaign.status}</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <MiniStat label="Content" value={String(count)} />
                        <MiniStat label="Theme" value={campaign.theme} />
                        <MiniStat label="Status" value={campaign.status} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5" /> Hashtag Intelligence</CardTitle>
                <CardDescription>Trending, performance, platform fit, and category recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.hashtags.map((tag) => (
                  <div key={tag.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{tag.hashtag}</p>
                        <p className="text-xs text-muted-foreground">{tag.category} · {tag.platform}</p>
                      </div>
                      <Badge variant="secondary"><Flame className="mr-1 h-3 w-3" /> {Math.round(tag.trendingScore)}</Badge>
                    </div>
                    <Progress className="mt-3 h-2" value={Math.min(100, tag.performanceScore)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="connectors" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wifi className="h-5 w-5" /> API Connection Status</CardTitle>
                <CardDescription>Connector architecture is live with health states and platform priorities. OAuth publishing can plug into this layer.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {summary.connectors.map((connector) => (
                  <div key={connector.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{connector.platform}</p>
                        <p className="text-xs text-muted-foreground">Tier {connector.tier} · {connector.notes}</p>
                      </div>
                      <ConnectorBadge health={connector.health} status={connector.status} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">Last checked {formatDateTime(connector.lastCheckedAt)}</p>
                      <Button variant="outline" size="sm" disabled={isSaving} onClick={() => mutate(() => apiRequest(`/api/onesocial/connectors/${connector.id}/check`, { method: "POST", body: JSON.stringify({ status: connector.status }) }), `${connector.platform} checked`)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Check
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Recent Activity</CardTitle>
                <CardDescription>Operational trail for content, publishing, AI, and connectors.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.activity.map((row) => (
                  <div key={row.id} className="flex gap-3 rounded-xl border p-3 text-sm">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-medium">{row.message}</p>
                      <p className="text-xs text-muted-foreground">{row.actor} · {formatDateTime(row.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>}

      <ContentDialog
        open={dialog === "content"}
        campaigns={summary.campaigns}
        onOpenChange={(open) => setDialog(open ? "content" : null)}
        onSubmit={(data) => mutate(() => apiRequest("/api/onesocial/content", { method: "POST", body: JSON.stringify(data) }), "Content workspace created").then(() => setDialog(null))}
      />
      <ScheduleDialog
        open={dialog === "schedule"}
        content={selectedContent}
        versions={selectedVersions}
        onOpenChange={(open) => setDialog(open ? "schedule" : null)}
        onSubmit={(data) => mutate(() => apiRequest("/api/onesocial/schedule", { method: "POST", body: JSON.stringify(data) }), "Publishing job scheduled").then(() => setDialog(null))}
      />
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: React.ElementType; tone: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 truncate font-mono text-2xl font-bold">{value}</p>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted ${tone}`}><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-muted/20 p-3"><p className="truncate text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate font-mono font-semibold">{value}</p></div>;
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return <div className="rounded-xl border border-dashed p-8 text-center"><Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/45" /><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>;
}

function StatusBadge({ status }: { status: string }) {
  const isGood = ["approved", "scheduled", "published", "ready"].includes(status);
  const isBad = ["failed", "rejected", "missed"].includes(status);
  return <Badge variant={isGood ? "default" : isBad ? "destructive" : "outline"}>{(lifecycleLabels[status] || status).replaceAll("_", " ")}</Badge>;
}

function ConnectorBadge({ health, status }: { health: string; status: string }) {
  const Icon = health === "healthy" ? CheckCircle2 : health === "critical" ? XCircle : Compass;
  return (
    <Badge variant={health === "healthy" ? "default" : "outline"} className="gap-1">
      <Icon className="h-3 w-3" /> {status.replaceAll("_", " ")}
    </Badge>
  );
}

function PlatformLogo({ platform, size = "md" }: { platform: string; size?: "sm" | "md" | "lg" }) {
  const brand = platformBrand[platform] || { label: platform, mark: platform.slice(0, 2).toUpperCase(), color: "#64748b", bg: "#f1f5f9" };
  const sizeClass = size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <span className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-lg font-bold`} style={{ backgroundColor: brand.bg, color: brand.color }}>
      {brand.mark}
    </span>
  );
}

function PlatformPill({ platform }: { platform: string }) {
  const brand = platformBrand[platform] || { label: platform, mark: platform.slice(0, 2).toUpperCase(), color: "#64748b", bg: "#f1f5f9" };
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
      <PlatformLogo platform={platform} size="sm" />
      <span>{brand.label}</span>
    </span>
  );
}

function PeopleSection({ people }: { people: SocialPerson[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> People & Audiences</CardTitle>
          <CardDescription>DB-backed audience segments, creators, prospects, community members, and relationship context.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {people.map((person) => (
            <div key={person.id} className="rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <PlatformLogo platform={person.platform} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-semibold">{person.name}</p>
                    <Badge variant="outline">{person.relationshipStage}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{person.role || "Audience"}{person.company ? ` · ${person.company}` : ""}</p>
                  <p className="mt-2 text-sm">{person.notes || "No notes yet."}</p>
                  {person.handle && <p className="mt-2 font-mono text-xs text-muted-foreground">@{person.handle}</p>}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Relationship Coverage</CardTitle>
          <CardDescription>Audience stages across the social operating system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {["lead", "peer", "customer", "partner", "community", "mentor"].map((stage) => {
            const count = people.filter((person) => person.relationshipStage === stage).length;
            return <MiniStat key={stage} label={stage} value={String(count)} />;
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function CirclesSection({ circles }: { circles: SocialCircle[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Circles</CardTitle>
        <CardDescription>Groups for campaigns, community loops, distribution, feedback, and recurring engagement.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {circles.map((circle) => (
          <div key={circle.id} className="rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: circle.color }} />
              <p className="font-semibold">{circle.name}</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{circle.purpose}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniStat label="Members" value={String(circle.memberCount)} />
              <MiniStat label="Cadence" value={circle.cadence} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FollowupsSection({ followups, people, circles }: { followups: SocialFollowup[]; people: SocialPerson[]; circles: SocialCircle[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Handshake className="h-5 w-5" /> Follow-ups</CardTitle>
        <CardDescription>Relationship tasks and comment/reply loops connected to platforms and circles.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {followups.map((followup) => {
          const person = people.find((entry) => entry.id === followup.personId);
          const circle = circles.find((entry) => entry.id === followup.circleId);
          return (
            <div key={followup.id} className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <PlatformPill platform={followup.channel} />
                  <StatusBadge status={followup.status} />
                </div>
                <p className="mt-2 font-semibold">{followup.title}</p>
                <p className="text-sm text-muted-foreground">{person?.name || "Audience"} · {circle?.name || "No circle"} · due {formatDateTime(followup.dueAt)}</p>
                {followup.notes && <p className="mt-2 text-sm text-muted-foreground">{followup.notes}</p>}
              </div>
              <Button variant="outline" size="sm">Mark Done</Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function WorkflowSection({ rules, queue }: { rules: AutomationRule[]; queue: QueueItem[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5" /> Automation Workflow Builder</CardTitle>
          <CardDescription>Zapier/n8n-style triggers and actions, backed by automation-rule rows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="grid gap-3 rounded-xl border bg-muted/10 p-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
              <WorkflowNode icon={Zap} title="Trigger" label={rule.triggerConfig} tone="text-orange-600" />
              <ArrowRight className="hidden h-5 w-5 text-muted-foreground lg:block" />
              <WorkflowNode icon={Bot} title="Logic" label={rule.name} tone="text-primary" />
              <ArrowRight className="hidden h-5 w-5 text-muted-foreground lg:block" />
              <WorkflowNode icon={Send} title="Action" label={rule.actionConfig} tone="text-emerald-600" status={rule.status} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Queue Feeding Automations</CardTitle>
          <CardDescription>Scheduled jobs currently available for workflow triggers.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {queue.map((item) => <MiniStat key={item.id} label={`${item.platform} · ${item.status}`} value={formatDateTime(item.scheduledAt)} />)}
        </CardContent>
      </Card>
    </div>
  );
}

function WorkflowNode({ icon: Icon, title, label, tone, status }: { icon: React.ElementType; title: string; label: string; tone: string; status?: string }) {
  return (
    <div className="rounded-xl border bg-background p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${tone}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="text-xs uppercase text-muted-foreground">{title}</p>
          <p className="truncate font-medium">{label}</p>
        </div>
      </div>
      {status && <Badge className="mt-3" variant={status === "active" ? "default" : "outline"}>{status}</Badge>}
    </div>
  );
}

function AnalyticsSection({ summary }: { summary: SocialSummary }) {
  const recentPosts = summary.content.slice(0, 5);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Platform Performance</CardTitle>
          <CardDescription>Views, engagement, recent posts, and platform connection state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.connectors.map((connector) => {
            const platformKey = connector.platform.includes("LinkedIn") ? "linkedin_post" : connector.platform;
            const analytics = summary.analytics.filter((row) => row.platform === platformKey);
            const views = analytics.reduce((sum, row) => sum + row.impressions, 0);
            return (
              <div key={connector.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><PlatformLogo platform={connector.platform} /><div><p className="font-semibold">{connector.platform}</p><p className="text-xs text-muted-foreground">{connector.status.replaceAll("_", " ")}</p></div></div>
                  <p className="font-mono text-xl font-bold">{views}</p>
                </div>
                <Progress className="mt-3 h-2" value={Math.min(100, views / 20)} />
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Latest content records from the live database.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentPosts.map((post) => (
            <div key={post.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between gap-3"><p className="font-medium">{post.title}</p><StatusBadge status={post.status} /></div>
              <p className="mt-1 text-sm text-muted-foreground">{post.summary || post.body.slice(0, 120)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSection({ connectors, isSaving, onConfigure, onCheck }: { connectors: Connector[]; isSaving: boolean; onConfigure: (id: number, data: any) => void; onCheck: (id: number) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wifi className="h-5 w-5" /> Connection Settings</CardTitle>
        <CardDescription>Save account names and connector credentials. Secrets are write-only in this UI and are never rendered back.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-2">
        {connectors.map((connector) => <ConnectorSettingsCard key={connector.id} connector={connector} isSaving={isSaving} onConfigure={onConfigure} onCheck={onCheck} />)}
      </CardContent>
    </Card>
  );
}

function ConnectorSettingsCard({ connector, isSaving, onConfigure, onCheck }: { connector: Connector; isSaving: boolean; onConfigure: (id: number, data: any) => void; onCheck: (id: number) => void }) {
  const [form, setForm] = useState({ accountName: connector.accountName || "", username: connector.username || "", authType: connector.authType || "oauth", credentialSecret: "" });
  useEffect(() => {
    setForm({ accountName: connector.accountName || "", username: connector.username || "", authType: connector.authType || "oauth", credentialSecret: "" });
  }, [connector]);
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3"><PlatformLogo platform={connector.platform} /><div><p className="font-semibold">{connector.platform}</p><p className="text-xs text-muted-foreground">Tier {connector.tier} · {connector.credentialStatus.replaceAll("_", " ")}</p></div></div>
        <ConnectorBadge health={connector.health} status={connector.status} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Account Name"><Input value={form.accountName} onChange={(event) => setForm({ ...form, accountName: event.target.value })} /></Field>
        <Field label="Username"><Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></Field>
        <Field label="Auth Type"><Select value={form.authType} onValueChange={(value) => setForm({ ...form, authType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["oauth", "api_key", "password", "webhook", "manual"].map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Token / Password"><Input type="password" value={form.credentialSecret} placeholder={connector.credentialStatus === "configured" ? "Configured" : "Write-only"} onChange={(event) => setForm({ ...form, credentialSecret: event.target.value })} /></Field>
      </div>
      {connector.lastError && <p className="mt-3 text-sm text-destructive">{connector.lastError}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" disabled={isSaving} onClick={() => onCheck(connector.id)}>Check</Button>
        <Button size="sm" disabled={isSaving} onClick={() => onConfigure(connector.id, form)}>Save Connection</Button>
      </div>
    </div>
  );
}

function ContentWorkspace({ content, versions, isSaving, onGenerate, onMove, onSchedule }: { content: SocialContent | null; versions: PlatformVersion[]; isSaving: boolean; onGenerate: () => void; onMove: (status: string) => void; onSchedule: () => void }) {
  if (!content) return <Card><CardContent className="p-6"><EmptyState icon={FileText} title="No content selected" description="Create a content item to start the workspace." /></CardContent></Card>;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2"><StatusBadge status={content.status} /><Badge variant="outline">{content.approvalStatus.replaceAll("_", " ")}</Badge></div>
            <CardTitle className="mt-3">{content.title}</CardTitle>
            <CardDescription>{content.summary || "No summary yet."}</CardDescription>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={isSaving} onClick={onGenerate}><Sparkles className="mr-2 h-4 w-4" /> Adapt</Button>
            <Button disabled={isSaving} onClick={onSchedule}><CalendarDays className="mr-2 h-4 w-4" /> Schedule</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <MiniStat label="Audience" value={content.audience || "General"} />
            <MiniStat label="CTA" value={content.cta || "Not set"} />
            <MiniStat label="Topics" value={content.topics || "Not tagged"} />
            <MiniStat label="Updated" value={formatDateTime(content.updatedAt)} />
          </div>
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">Master Body</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{content.body}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["research", "draft", "ai_enhancement", "review", "approved", "scheduled", "published", "repurpose"].map((status) => (
              <Button key={status} variant="outline" size="sm" disabled={isSaving || content.status === status} onClick={() => onMove(status)}>
                {lifecycleLabels[status]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5" /> Platform Versions</CardTitle>
          <CardDescription>AI-ready adaptations generated from the master content item.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {versions.map((version) => (
            <div key={version.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{platformOptions.find(([value]) => value === version.platform)?.[1] || version.platform}</p>
                  <p className="text-xs text-muted-foreground">{version.characterCount} characters · {version.hashtags}</p>
                </div>
                <StatusBadge status={version.status} />
              </div>
              <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm text-muted-foreground">{version.body}</p>
              <Button variant="ghost" size="sm" className="mt-3 px-0"><ExternalLink className="mr-2 h-4 w-4" /> Preview</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ContentDialog({ open, onOpenChange, onSubmit, campaigns }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void; campaigns: SocialCampaign[] }) {
  const [form, setForm] = useState({ title: "", summary: "", body: "", contentType: "linkedin_post", campaignId: "", audience: "", cta: "", topics: "", tags: "", status: "draft", approvalStatus: "draft" });
  useEffect(() => {
    if (open) setForm({ title: "", summary: "", body: "", contentType: "linkedin_post", campaignId: "", audience: "", cta: "", topics: "", tags: "", status: "draft", approvalStatus: "draft" });
  }, [open]);
  const submit = () => {
    if (!form.title.trim() || !form.body.trim()) return;
    onSubmit({ ...form, title: form.title.trim(), summary: form.summary || null, campaignId: form.campaignId ? Number(form.campaignId) : null, audience: form.audience || null, cta: form.cta || null, topics: form.topics || null, tags: form.tags || null });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Create Content Workspace</DialogTitle><DialogDescription>Start with one master item. OneSocial will create platform-ready versions automatically.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title"><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
          <Field label="Content Type"><Select value={form.contentType} onValueChange={(value) => setForm({ ...form, contentType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{contentTypes.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Campaign"><Select value={form.campaignId} onValueChange={(value) => setForm({ ...form, campaignId: value })}><SelectTrigger><SelectValue placeholder="Optional campaign" /></SelectTrigger><SelectContent>{campaigns.map((campaign) => <SelectItem key={campaign.id} value={String(campaign.id)}>{campaign.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Audience"><Input value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Summary"><Input value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></Field></div>
          <div className="sm:col-span-2"><Field label="Master Body"><Textarea className="min-h-36" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></Field></div>
          <Field label="CTA"><Input value={form.cta} onChange={(event) => setForm({ ...form, cta: event.target.value })} /></Field>
          <Field label="Topics"><Input value={form.topics} onChange={(event) => setForm({ ...form, topics: event.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Tags"><Input placeholder="AI, OneLife, Azure" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></Field></div>
        </div>
        <div className="flex justify-end"><Button onClick={submit}>Create and Adapt</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleDialog({ open, onOpenChange, onSubmit, content, versions }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void; content: SocialContent | null; versions: PlatformVersion[] }) {
  const [form, setForm] = useState({ platform: "linkedin_post", platformVersionId: "", scheduledAt: "" });
  useEffect(() => {
    if (open) {
      const first = versions[0];
      setForm({
        platform: first?.platform ?? "linkedin_post",
        platformVersionId: first ? String(first.id) : "",
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
      });
    }
  }, [open, versions]);
  const submit = () => {
    if (!content || !form.scheduledAt) return;
    onSubmit({ contentId: content.id, platformVersionId: form.platformVersionId ? Number(form.platformVersionId) : null, platform: form.platform, status: "scheduled", scheduledAt: new Date(form.scheduledAt).toISOString() });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule Publishing</DialogTitle><DialogDescription>{content ? `Queue "${content.title}" for a platform.` : "Select content first."}</DialogDescription></DialogHeader>
        <Field label="Platform Version">
          <Select value={form.platformVersionId} onValueChange={(value) => {
            const version = versions.find((item) => String(item.id) === value);
            setForm({ ...form, platformVersionId: value, platform: version?.platform ?? form.platform });
          }}>
            <SelectTrigger><SelectValue placeholder="Select version" /></SelectTrigger>
            <SelectContent>{versions.map((version) => <SelectItem key={version.id} value={String(version.id)}>{platformOptions.find(([value]) => value === version.platform)?.[1] || version.platform}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Schedule Time"><Input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} /></Field>
        <div className="flex justify-end"><Button disabled={!content} onClick={submit}>Add to Queue</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
