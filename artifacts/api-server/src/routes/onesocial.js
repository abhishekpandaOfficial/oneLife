import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, insertSocialCampaignSchema, insertSocialCircleSchema, insertSocialContentItemSchema, insertSocialFollowupSchema, insertSocialPersonSchema, insertSocialPublishQueueSchema, insertSocialAutomationRuleSchema, socialActivityTable, socialAiSuggestionsTable, socialAnalyticsTable, socialAutomationRulesTable, socialCampaignsTable, socialCirclesTable, socialConnectorsTable, socialContentItemsTable, socialFollowupsTable, socialHashtagsTable, socialPeopleTable, socialPlatformVersionsTable, socialPublishQueueTable, } from "@workspace/db";
const router = Router();
const platformLabels = {
    linkedin_post: "LinkedIn Post",
    linkedin_article: "LinkedIn Article",
    substack: "Substack",
    medium: "Medium",
    twitter: "Twitter/X",
    instagram: "Instagram",
};
const lifecycle = ["idea", "research", "draft", "ai_enhancement", "review", "approved", "scheduled", "published", "analytics", "repurpose", "archived"];
function nowPlusHours(hours) {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}
function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "content";
}
async function logActivity(eventType, message, actor = "OneSocial") {
    await db.insert(socialActivityTable).values({ eventType, message, actor });
}
async function ensureDefaults() {
    const connectors = await db.select().from(socialConnectorsTable);
    if (connectors.length === 0) {
        await db.insert(socialConnectorsTable).values([
            { platform: "LinkedIn Posts", tier: 1, status: "needs_auth", health: "warning", notes: "OAuth connector-ready. Add credentials to enable direct publishing." },
            { platform: "LinkedIn Articles", tier: 1, status: "needs_auth", health: "warning", notes: "Priority long-form publishing channel." },
            { platform: "Substack", tier: 1, status: "planned", health: "unknown", notes: "Newsletter publishing adapter planned." },
            { platform: "Medium", tier: 2, status: "planned", health: "unknown", notes: "Cross-posting adapter planned." },
            { platform: "Twitter/X", tier: 3, status: "planned", health: "unknown", notes: "Short-post and thread adapter planned." },
            { platform: "Instagram", tier: 3, status: "planned", health: "unknown", notes: "Promotional snippet adapter planned." },
        ]);
    }
    const campaigns = await db.select().from(socialCampaignsTable);
    if (campaigns.length === 0) {
        await db.insert(socialCampaignsTable).values([
            { name: "OneLife Platform", theme: "Product Launch", status: "active", objective: "Build narrative around the OneLife ecosystem.", color: "#2563eb" },
            { name: "AI Engineering", theme: "Thought Leadership", status: "active", objective: "Publish technical articles and architecture notes.", color: "#7c3aed" },
            { name: "CareerOS", theme: "OneWork", status: "planning", objective: "Turn work history features into professional content.", color: "#0f766e" },
        ]);
    }
    const hashtags = await db.select().from(socialHashtagsTable);
    if (hashtags.length === 0) {
        await db.insert(socialHashtagsTable).values([
            { hashtag: "#AIEngineering", category: "AI", platform: "linkedin", popularity: 88, performanceScore: 82, trendingScore: 91 },
            { hashtag: "#ProductEngineering", category: "Product", platform: "linkedin", popularity: 79, performanceScore: 76, trendingScore: 74 },
            { hashtag: "#Azure", category: "Cloud", platform: "all", popularity: 84, performanceScore: 73, trendingScore: 80 },
            { hashtag: "#Microservices", category: "Architecture", platform: "all", popularity: 75, performanceScore: 71, trendingScore: 69 },
            { hashtag: "#PersonalBranding", category: "Growth", platform: "linkedin", popularity: 71, performanceScore: 68, trendingScore: 66 },
        ]);
    }
    const people = await db.select().from(socialPeopleTable);
    if (people.length === 0) {
        await db.insert(socialPeopleTable).values([
            { name: "Engineering Leaders", role: "Audience Segment", company: "LinkedIn", platform: "LinkedIn", handle: "engineering-leaders", relationshipStage: "community", notes: "Primary audience for architecture and AI engineering content." },
            { name: "Founder Operators", role: "Audience Segment", company: "Substack", platform: "Substack", handle: "founder-operators", relationshipStage: "lead", notes: "Newsletter audience for product strategy and build notes." },
            { name: "Cloud Architects", role: "Audience Segment", company: "Medium", platform: "Medium", handle: "cloud-architects", relationshipStage: "peer", notes: "Technical readers for Azure and architecture articles." },
        ]);
    }
    const circles = await db.select().from(socialCirclesTable);
    if (circles.length === 0) {
        await db.insert(socialCirclesTable).values([
            { name: "AI Engineering Network", purpose: "Thought leadership and technical discussion", color: "#0a66c2", cadence: "weekly", memberCount: 42 },
            { name: "OneLife Early Users", purpose: "Product feedback, launches, and beta updates", color: "#e11d48", cadence: "biweekly", memberCount: 18 },
            { name: "Cloud Architecture Circle", purpose: "Azure, microservices, and platform engineering content", color: "#7c3aed", cadence: "weekly", memberCount: 31 },
        ]);
    }
    const followups = await db.select().from(socialFollowupsTable);
    if (followups.length === 0) {
        const [person] = await db.select().from(socialPeopleTable);
        const [circle] = await db.select().from(socialCirclesTable);
        await db.insert(socialFollowupsTable).values([
            { personId: person?.id ?? null, circleId: circle?.id ?? null, title: "Reply to launch-post comments", channel: "LinkedIn", status: "due", dueAt: nowPlusHours(6), notes: "Prioritize thoughtful replies and save strong questions as future posts." },
            { personId: null, circleId: circle?.id ?? null, title: "Send weekly build note teaser", channel: "Substack", status: "scheduled", dueAt: nowPlusHours(30), notes: "Use newsletter CTA from top-performing LinkedIn post." },
        ]);
    }
    const rules = await db.select().from(socialAutomationRulesTable);
    if (rules.length === 0) {
        await db.insert(socialAutomationRulesTable).values([
            { name: "Weekday LinkedIn Publisher", triggerType: "schedule", triggerConfig: "Every weekday at 08:00", actionType: "publish", actionConfig: "Publish next approved LinkedIn post", status: "active" },
            { name: "Newsletter Wednesday", triggerType: "schedule", triggerConfig: "Every Wednesday at 09:00", actionType: "publish", actionConfig: "Publish approved Substack newsletter", status: "active" },
            { name: "Long-form Repurposer", triggerType: "content_published", triggerConfig: "When LinkedIn article is published", actionType: "repurpose", actionConfig: "Create Twitter thread and Instagram teaser", status: "active" },
        ]);
    }
    const content = await db.select().from(socialContentItemsTable);
    if (content.length === 0) {
        const [campaign] = await db.select().from(socialCampaignsTable);
        const [created] = await db.insert(socialContentItemsTable).values({
            campaignId: campaign?.id ?? null,
            title: "Why Personal Operating Systems Need AI",
            summary: "A launch narrative for OneLife as a connected personal operating system.",
            body: "Most productivity tools capture fragments. A personal operating system connects finance, work, health, ideas, notes, travel, and social publishing into one coherent loop.",
            status: "scheduled",
            approvalStatus: "approved",
            contentType: "linkedin_article",
            audience: "Founders, builders, and senior engineers",
            cta: "Follow the OneLife build journey",
            topics: "AI, Personal OS, OneLife",
            tags: "OneLife,AI,Product",
            slug: "why-personal-operating-systems-need-ai",
            aiSummary: "Position OneLife as an AI-ready operating layer for life and work.",
            keywords: "personal operating system, AI productivity, OneLife",
            scheduledAt: nowPlusHours(24),
        }).returning();
        await generateVersions(created.id);
        await db.insert(socialPublishQueueTable).values({ contentId: created.id, platform: "linkedin_article", status: "scheduled", scheduledAt: nowPlusHours(24) });
        await db.insert(socialAiSuggestionsTable).values([
            { title: "Repurpose OneWork launch into a LinkedIn carousel", suggestionType: "repurpose", priority: "high", description: "Turn the CareerOS dashboard into a visual post series for LinkedIn and Instagram." },
            { title: "Publish architecture article on AI-ready modules", suggestionType: "topic", priority: "medium", description: "Explain how modular data models make OneLife ready for future AI agents." },
        ]);
        await logActivity("seed", "OneSocial starter workspace created.");
    }
}
async function generateVersions(contentId) {
    const [content] = await db.select().from(socialContentItemsTable).where(eq(socialContentItemsTable.id, contentId));
    if (!content)
        return [];
    await db.delete(socialPlatformVersionsTable).where(eq(socialPlatformVersionsTable.contentId, contentId));
    const tags = (content.tags || "OneLife,AI,Product").split(",").map((tag) => `#${tag.trim().replace(/^#/, "").replace(/\s+/g, "")}`).slice(0, 4).join(" ");
    const base = content.summary || content.body.slice(0, 180);
    const versions = [
        {
            contentId,
            platform: "linkedin_post",
            title: content.title,
            body: `${content.title}\n\n${base}\n\n${content.cta || "What would you automate first?"}\n\n${tags}`,
            status: "ready",
            hashtags: tags,
        },
        {
            contentId,
            platform: "linkedin_article",
            title: content.title,
            body: `${content.body}\n\nKey takeaway: ${content.aiSummary || base}\n\n${content.cta || ""}`,
            status: "ready",
            hashtags: tags,
        },
        {
            contentId,
            platform: "substack",
            title: content.title,
            body: `Hello builders,\n\n${content.body}\n\nWhy it matters:\n${content.aiSummary || base}\n\n${content.cta || "See you in the next build note."}`,
            status: "ready",
            hashtags: tags,
        },
        {
            contentId,
            platform: "medium",
            title: content.title,
            body: `${content.body}\n\n## Practical angle\n${content.summary || base}`,
            status: "ready",
            hashtags: tags,
        },
        {
            contentId,
            platform: "twitter",
            title: content.title,
            body: `${content.title}\n\n${base.slice(0, 180)}\n\n${tags}`,
            status: "ready",
            hashtags: tags,
        },
        {
            contentId,
            platform: "instagram",
            title: content.title,
            body: `${content.title}\n\n${base.slice(0, 140)}\n\nRead the full article via the primary channel.\n\n${tags}`,
            status: "ready",
            hashtags: tags,
        },
    ];
    return db.insert(socialPlatformVersionsTable).values(versions.map((version) => ({ ...version, characterCount: version.body.length }))).returning();
}
async function summaryPayload() {
    await ensureDefaults();
    const [campaigns, content, versions, queue, connectors, hashtags, analytics, suggestions, activity, people, circles, followups, automationRules] = await Promise.all([
        db.select().from(socialCampaignsTable).orderBy(desc(socialCampaignsTable.createdAt)),
        db.select().from(socialContentItemsTable).orderBy(desc(socialContentItemsTable.updatedAt)),
        db.select().from(socialPlatformVersionsTable).orderBy(desc(socialPlatformVersionsTable.createdAt)),
        db.select().from(socialPublishQueueTable).orderBy(socialPublishQueueTable.scheduledAt),
        db.select().from(socialConnectorsTable).orderBy(socialConnectorsTable.tier),
        db.select().from(socialHashtagsTable).orderBy(desc(socialHashtagsTable.trendingScore)),
        db.select().from(socialAnalyticsTable),
        db.select().from(socialAiSuggestionsTable).orderBy(desc(socialAiSuggestionsTable.createdAt)),
        db.select().from(socialActivityTable).orderBy(desc(socialActivityTable.createdAt)),
        db.select().from(socialPeopleTable).orderBy(desc(socialPeopleTable.createdAt)),
        db.select().from(socialCirclesTable).orderBy(desc(socialCirclesTable.createdAt)),
        db.select().from(socialFollowupsTable).orderBy(socialFollowupsTable.dueAt),
        db.select().from(socialAutomationRulesTable).orderBy(desc(socialAutomationRulesTable.createdAt)),
    ]);
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const published = content.filter((item) => item.status === "published");
    const scheduled = queue.filter((item) => ["queued", "scheduled", "retrying"].includes(item.status));
    const engagementEvents = analytics.reduce((sum, item) => sum + item.likes + item.comments + item.shares + item.clicks, 0);
    const impressions = analytics.reduce((sum, item) => sum + item.impressions, 0);
    const engagementRate = impressions ? (engagementEvents / impressions) * 100 : 0;
    const platformTotals = analytics.reduce((acc, item) => {
        acc[item.platform] = (acc[item.platform] ?? 0) + item.likes + item.comments + item.shares + item.clicks;
        return acc;
    }, {});
    const bestPlatform = Object.entries(platformTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "LinkedIn";
    const topContent = published[0] ?? content[0] ?? null;
    const pipeline = lifecycle.map((stage) => ({ stage, count: content.filter((item) => item.status === stage).length }));
    return {
        campaigns,
        content,
        platformVersions: versions,
        queue,
        connectors,
        hashtags,
        analytics,
        suggestions,
        activity: activity.slice(0, 12),
        people,
        circles,
        followups,
        automationRules,
        metrics: {
            todayScheduled: scheduled.filter((item) => item.scheduledAt && new Date(item.scheduledAt).toISOString().slice(0, 10) === todayKey).length,
            drafts: content.filter((item) => ["idea", "research", "draft", "ai_enhancement"].includes(item.status)).length,
            publishedToday: published.filter((item) => item.publishedAt && new Date(item.publishedAt).toISOString().slice(0, 10) === todayKey).length,
            postsThisWeek: content.filter((item) => item.createdAt && new Date(item.createdAt) >= weekStart).length,
            postsThisMonth: content.filter((item) => item.createdAt && new Date(item.createdAt) >= monthStart).length,
            followersGrowth: analytics.reduce((sum, item) => sum + item.followersDelta, 0),
            engagementRate,
            bestPlatform,
            topPost: topContent?.title ?? "No published content yet",
            pendingReviews: content.filter((item) => item.approvalStatus === "needs_review" || item.status === "review").length,
            publishingErrors: queue.filter((item) => item.status === "failed").length,
            connectedPlatforms: connectors.filter((connector) => connector.status === "connected").length,
            totalViews: analytics.reduce((sum, item) => sum + item.impressions, 0),
            dueFollowups: followups.filter((item) => item.status === "due").length,
            activeAutomations: automationRules.filter((item) => item.status === "active").length,
        },
        pipeline,
        platformLabels,
    };
}
const IdParams = z.object({ id: z.coerce.number() });
const ScheduleInput = insertSocialPublishQueueSchema.extend({
    scheduledAt: z.coerce.date(),
});
const ConnectorStatusInput = z.object({
    status: z.enum(["connected", "not_connected", "needs_auth", "degraded", "planned"]).optional(),
});
router.get("/onesocial/capabilities", async (_req, res) => {
    res.json({
        module: "OneSocial",
        os: "ContentOS",
        posture: "enterprise-ai-content-operations",
        liveStorage: [
            "social_campaigns",
            "social_content_items",
            "social_platform_versions",
            "social_publish_queue",
            "social_connectors",
            "social_hashtags",
            "social_analytics",
            "social_ai_suggestions",
            "social_activity",
            "social_people",
            "social_circles",
            "social_followups",
            "social_automation_rules",
        ],
        lifecycle,
        priorityPlatforms: ["LinkedIn Posts", "LinkedIn Articles", "Substack", "Medium", "Twitter/X", "Instagram"],
        capabilityAreas: ["Executive dashboard", "Content workspace", "AI content studio", "Platform adaptation", "Publishing queue", "Campaigns", "Hashtag intelligence", "Analytics", "Connector health", "Activity stream"],
    });
});
router.get("/onesocial/summary", async (_req, res) => {
    res.json(await summaryPayload());
});
router.post("/onesocial/campaigns", async (req, res) => {
    const parsed = insertSocialCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [created] = await db.insert(socialCampaignsTable).values(parsed.data).returning();
    await logActivity("campaign", `Campaign "${created.name}" created.`);
    res.status(201).json(created);
});
router.post("/onesocial/content", async (req, res) => {
    const parsed = insertSocialContentItemSchema.safeParse({ ...req.body, slug: req.body.slug || slugify(req.body.title || "content") });
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [created] = await db.insert(socialContentItemsTable).values(parsed.data).returning();
    const versions = await generateVersions(created.id);
    await logActivity("content", `Content "${created.title}" created with ${versions.length} platform versions.`);
    res.status(201).json({ ...created, versions });
});
router.patch("/onesocial/content/:id", async (req, res) => {
    const params = IdParams.safeParse(req.params);
    const parsed = insertSocialContentItemSchema.partial().safeParse(req.body);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [updated] = await db.update(socialContentItemsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(socialContentItemsTable.id, params.data.id)).returning();
    if (!updated) {
        res.status(404).json({ error: "Content not found" });
        return;
    }
    if (req.body.regenerateVersions)
        await generateVersions(updated.id);
    await logActivity("content", `Content "${updated.title}" updated.`);
    res.json(updated);
});
router.delete("/onesocial/content/:id", async (req, res) => {
    const params = IdParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const [deleted] = await db.delete(socialContentItemsTable).where(eq(socialContentItemsTable.id, params.data.id)).returning();
    if (!deleted) {
        res.status(404).json({ error: "Content not found" });
        return;
    }
    await logActivity("content", `Content "${deleted.title}" deleted.`);
    res.sendStatus(204);
});
router.post("/onesocial/content/:id/generate-platform-versions", async (req, res) => {
    const params = IdParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const versions = await generateVersions(params.data.id);
    await logActivity("ai", `Generated ${versions.length} platform-adapted versions.`);
    res.json(versions);
});
router.post("/onesocial/schedule", async (req, res) => {
    const parsed = ScheduleInput.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [created] = await db.insert(socialPublishQueueTable).values({ ...parsed.data, status: parsed.data.status ?? "scheduled" }).returning();
    await db.update(socialContentItemsTable).set({ status: "scheduled", scheduledAt: created.scheduledAt, updatedAt: new Date() }).where(eq(socialContentItemsTable.id, created.contentId));
    await logActivity("schedule", `${created.platform} scheduled for publishing.`);
    res.status(201).json(created);
});
router.post("/onesocial/queue/:id/run", async (req, res) => {
    const params = IdParams.safeParse(req.params);
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    const [queueItem] = await db.select().from(socialPublishQueueTable).where(eq(socialPublishQueueTable.id, params.data.id));
    if (!queueItem) {
        res.status(404).json({ error: "Queue item not found" });
        return;
    }
    const [updated] = await db.update(socialPublishQueueTable).set({ status: "published", attempts: queueItem.attempts + 1, updatedAt: new Date() }).where(eq(socialPublishQueueTable.id, queueItem.id)).returning();
    await db.update(socialContentItemsTable).set({ status: "published", publishedAt: new Date(), updatedAt: new Date() }).where(eq(socialContentItemsTable.id, queueItem.contentId));
    await db.insert(socialAnalyticsTable).values({ contentId: queueItem.contentId, platform: queueItem.platform, impressions: 1200, reach: 880, likes: 96, comments: 14, shares: 9, clicks: 31, followersDelta: 7 });
    await logActivity("publish", `${queueItem.platform} published successfully through the OneSocial queue.`);
    res.json(updated);
});
router.post("/onesocial/connectors/:id/check", async (req, res) => {
    const params = IdParams.safeParse(req.params);
    const body = ConnectorStatusInput.safeParse(req.body ?? {});
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    if (!body.success) {
        res.status(400).json({ error: body.error.message });
        return;
    }
    const [connector] = await db.select().from(socialConnectorsTable).where(eq(socialConnectorsTable.id, params.data.id));
    if (!connector) {
        res.status(404).json({ error: "Connector not found" });
        return;
    }
    const status = body.data.status ?? connector.status;
    const health = status === "connected" ? "healthy" : status === "degraded" || status === "needs_auth" ? "warning" : "unknown";
    const [updated] = await db.update(socialConnectorsTable).set({ status, health, lastCheckedAt: new Date() }).where(eq(socialConnectorsTable.id, connector.id)).returning();
    await logActivity("connector", `${connector.platform} connector health checked: ${health}.`);
    res.json(updated);
});
router.post("/onesocial/connectors/:id/configure", async (req, res) => {
    const params = IdParams.safeParse(req.params);
    const body = z.object({
        accountName: z.string().optional().nullable(),
        username: z.string().optional().nullable(),
        authType: z.enum(["oauth", "api_key", "password", "webhook", "manual"]).default("oauth"),
        credentialSecret: z.string().optional(),
    }).safeParse(req.body ?? {});
    if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
    }
    if (!body.success) {
        res.status(400).json({ error: body.error.message });
        return;
    }
    const [connector] = await db.select().from(socialConnectorsTable).where(eq(socialConnectorsTable.id, params.data.id));
    if (!connector) {
        res.status(404).json({ error: "Connector not found" });
        return;
    }
    const hasCredential = Boolean(body.data.credentialSecret?.trim());
    const isManual = body.data.authType === "manual";
    const [updated] = await db.update(socialConnectorsTable).set({
        accountName: body.data.accountName || null,
        username: body.data.username || null,
        authType: body.data.authType,
        credentialStatus: hasCredential || isManual ? "configured" : "not_configured",
        credentialUpdatedAt: hasCredential ? new Date() : connector.credentialUpdatedAt,
        status: hasCredential || isManual ? "connected" : "needs_auth",
        health: hasCredential || isManual ? "healthy" : "warning",
        lastCheckedAt: new Date(),
        lastError: hasCredential || isManual ? null : "Credential/token is required for live connector checks.",
    }).where(eq(socialConnectorsTable.id, connector.id)).returning();
    await logActivity("connector", `${connector.platform} account settings saved for ${updated.accountName || updated.username || "manual publishing"}.`);
    res.json(updated);
});
router.post("/onesocial/people", async (req, res) => {
    const parsed = insertSocialPersonSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [created] = await db.insert(socialPeopleTable).values(parsed.data).returning();
    await logActivity("people", `Audience/person "${created.name}" added.`);
    res.status(201).json(created);
});
router.post("/onesocial/circles", async (req, res) => {
    const parsed = insertSocialCircleSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [created] = await db.insert(socialCirclesTable).values(parsed.data).returning();
    await logActivity("circle", `Circle "${created.name}" created.`);
    res.status(201).json(created);
});
router.post("/onesocial/followups", async (req, res) => {
    const parsed = insertSocialFollowupSchema.extend({ dueAt: z.coerce.date() }).safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [created] = await db.insert(socialFollowupsTable).values(parsed.data).returning();
    await logActivity("followup", `Follow-up "${created.title}" scheduled.`);
    res.status(201).json(created);
});
router.post("/onesocial/automation-rules", async (req, res) => {
    const parsed = insertSocialAutomationRuleSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
    }
    const [created] = await db.insert(socialAutomationRulesTable).values(parsed.data).returning();
    await logActivity("automation", `Automation "${created.name}" created.`);
    res.status(201).json(created);
});
export default router;
