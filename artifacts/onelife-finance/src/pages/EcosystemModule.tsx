import React from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  FileText,
  Folder,
  Handshake,
  Lightbulb,
  MapPinned,
  Notebook,
  Plane,
  Plus,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ModuleKey = "social" | "note" | "idea" | "travel";

const moduleConfig: Record<ModuleKey, {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  status: string;
  features: Array<{ title: string; description: string; icon: React.ElementType; metric: string }>;
  workflow: string[];
  nextActions: string[];
}> = {
  social: {
    eyebrow: "RelationshipOS",
    title: "OneSocial",
    description: "People, circles, follow-ups, events, and the small context that makes relationships easier to maintain.",
    icon: Users,
    accent: "from-rose-500/15 via-card to-cyan-500/10 border-rose-500/20",
    status: "Relationship module mapped",
    features: [
      { title: "People", description: "Profiles, birthdays, notes, locations, and important context.", icon: Users, metric: "Contacts" },
      { title: "Circles", description: "Family, friends, professional groups, and priority networks.", icon: Circle, metric: "Groups" },
      { title: "Follow-ups", description: "Reminders for calls, messages, meetings, and thoughtful check-ins.", icon: Handshake, metric: "Due" },
    ],
    workflow: ["Add people", "Group into circles", "Schedule follow-ups", "Review weekly"],
    nextActions: ["Create people database", "Add relationship timeline", "Connect reminders to dashboard"],
  },
  note: {
    eyebrow: "KnowledgeOS",
    title: "OneNote",
    description: "Notes, documents, collections, resources, clipped references, and personal knowledge paths.",
    icon: Notebook,
    accent: "from-amber-500/15 via-card to-emerald-500/10 border-amber-500/20",
    status: "Knowledge module mapped",
    features: [
      { title: "Notes", description: "Daily notes, meeting notes, study notes, and personal logs.", icon: Notebook, metric: "Notes" },
      { title: "Collections", description: "Topic folders for health, learning, finance, work, and life admin.", icon: Folder, metric: "Stacks" },
      { title: "Resources", description: "Links, files, highlights, PDFs, and reference materials.", icon: FileText, metric: "Refs" },
    ],
    workflow: ["Capture", "Organize", "Summarize", "Retrieve"],
    nextActions: ["Create note editor", "Add tags and backlinks", "Surface recent notes on dashboard"],
  },
  idea: {
    eyebrow: "CreationOS",
    title: "OneIdea",
    description: "Ideas, experiments, validation, roadmaps, decisions, and the trail from spark to shipped.",
    icon: Lightbulb,
    accent: "from-fuchsia-500/15 via-card to-lime-500/10 border-fuchsia-500/20",
    status: "Idea module mapped",
    features: [
      { title: "Ideas", description: "Raw thoughts, product concepts, improvements, and opportunities.", icon: Lightbulb, metric: "Ideas" },
      { title: "Experiments", description: "Hypotheses, test plans, signals, and outcomes.", icon: Zap, metric: "Tests" },
      { title: "Roadmap", description: "Priorities, stages, launch notes, and future backlog.", icon: Target, metric: "Planned" },
    ],
    workflow: ["Capture spark", "Score impact", "Run experiment", "Promote to roadmap"],
    nextActions: ["Build idea scoring", "Add experiment board", "Link ideas to OneWork projects"],
  },
  travel: {
    eyebrow: "TravelOS",
    title: "OneTravel",
    description: "Trips, places, itineraries, bookings, documents, budgets, and memories in one travel hub.",
    icon: Plane,
    accent: "from-cyan-500/15 via-card to-violet-500/10 border-cyan-500/20",
    status: "Travel module mapped",
    features: [
      { title: "Trips", description: "Upcoming, active, and past travel plans with dates and status.", icon: Plane, metric: "Trips" },
      { title: "Places", description: "Cities, stays, restaurants, experiences, and saved maps.", icon: MapPinned, metric: "Saved" },
      { title: "Travel Docs", description: "Passports, visas, tickets, insurance, and booking files.", icon: FileText, metric: "Docs" },
    ],
    workflow: ["Plan trip", "Book essentials", "Carry documents", "Archive memories"],
    nextActions: ["Add trip planner", "Create travel document vault", "Connect trip budgets to OneFinance"],
  },
};

export default function EcosystemModule({ module }: { module: ModuleKey }) {
  const config = moduleConfig[module];
  const Icon = config.icon;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <section className={`overflow-hidden rounded-2xl border bg-gradient-to-br ${config.accent}`}>
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px] lg:p-7">
          <div>
            <Badge variant="outline" className="bg-background/80">{config.eyebrow}</Badge>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/80 text-primary shadow-sm">
                <Icon className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{config.title} Dashboard</h1>
            </div>
            <p className="mt-3 max-w-3xl text-muted-foreground">{config.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button disabled><Plus className="mr-2 h-4 w-4" /> Add first item</Button>
              <Link href="/app">
                <Button variant="outline">Back to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
          <Card className="bg-background/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                {config.status}
              </CardTitle>
              <CardDescription>Feature structure is ready for data-backed workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={35} />
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {config.features.map((feature) => (
                  <div key={feature.title} className="rounded-lg border bg-card p-2">
                    <p className="font-semibold">{feature.metric}</p>
                    <p className="text-muted-foreground">0</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {config.features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Module Workflow</CardTitle>
            <CardDescription>The operating rhythm this module will support.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {config.workflow.map((step, index) => (
              <div key={step} className="rounded-xl border bg-muted/20 p-4">
                <p className="font-mono text-xs text-muted-foreground">0{index + 1}</p>
                <p className="mt-2 font-semibold">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Build Queue</CardTitle>
            <CardDescription>Next implementation slices for this module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {config.nextActions.map((action) => (
              <div key={action} className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{action}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
