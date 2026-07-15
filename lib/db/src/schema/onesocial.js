import { pgTable, text, serial, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const socialCampaignsTable = pgTable("social_campaigns", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    theme: text("theme").notNull().default("Product"),
    status: text("status", { enum: ["planning", "active", "paused", "completed"] }).notNull().default("active"),
    objective: text("objective"),
    color: text("color").notNull().default("#2563eb"),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialContentItemsTable = pgTable("social_content_items", {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").references(() => socialCampaignsTable.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    summary: text("summary"),
    body: text("body").notNull().default(""),
    status: text("status", {
        enum: ["idea", "research", "draft", "ai_enhancement", "review", "approved", "scheduled", "published", "analytics", "repurpose", "archived"],
    }).notNull().default("idea"),
    approvalStatus: text("approval_status", { enum: ["draft", "needs_review", "approved", "rejected"] }).notNull().default("draft"),
    contentType: text("content_type", {
        enum: ["linkedin_post", "linkedin_article", "substack_newsletter", "medium_article", "twitter_thread", "twitter_post", "instagram_caption", "product_announcement", "technical_article", "career_post", "case_study"],
    }).notNull().default("linkedin_post"),
    audience: text("audience"),
    cta: text("cta"),
    topics: text("topics"),
    tags: text("tags"),
    series: text("series"),
    slug: text("slug"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    aiSummary: text("ai_summary"),
    keywords: text("keywords"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialPlatformVersionsTable = pgTable("social_platform_versions", {
    id: serial("id").primaryKey(),
    contentId: integer("content_id").notNull().references(() => socialContentItemsTable.id, { onDelete: "cascade" }),
    platform: text("platform", { enum: ["linkedin_post", "linkedin_article", "substack", "medium", "twitter", "instagram"] }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: text("status", { enum: ["draft", "ready", "scheduled", "published", "failed"] }).notNull().default("draft"),
    characterCount: integer("character_count").notNull().default(0),
    hashtags: text("hashtags"),
    publishUrl: text("publish_url"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialPublishQueueTable = pgTable("social_publish_queue", {
    id: serial("id").primaryKey(),
    contentId: integer("content_id").notNull().references(() => socialContentItemsTable.id, { onDelete: "cascade" }),
    platformVersionId: integer("platform_version_id").references(() => socialPlatformVersionsTable.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    status: text("status", { enum: ["queued", "scheduled", "publishing", "published", "failed", "missed", "retrying"] }).notNull().default("queued"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialConnectorsTable = pgTable("social_connectors", {
    id: serial("id").primaryKey(),
    platform: text("platform").notNull(),
    tier: integer("tier").notNull().default(1),
    status: text("status", { enum: ["connected", "not_connected", "needs_auth", "degraded", "planned"] }).notNull().default("not_connected"),
    accountName: text("account_name"),
    username: text("username"),
    authType: text("auth_type", { enum: ["oauth", "api_key", "password", "webhook", "manual"] }).notNull().default("oauth"),
    credentialStatus: text("credential_status", { enum: ["not_configured", "configured", "expired", "invalid"] }).notNull().default("not_configured"),
    credentialUpdatedAt: timestamp("credential_updated_at", { withTimezone: true }),
    health: text("health", { enum: ["healthy", "warning", "critical", "unknown"] }).notNull().default("unknown"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    lastError: text("last_error"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialHashtagsTable = pgTable("social_hashtags", {
    id: serial("id").primaryKey(),
    hashtag: text("hashtag").notNull(),
    category: text("category").notNull().default("General"),
    platform: text("platform").notNull().default("all"),
    popularity: integer("popularity").notNull().default(50),
    usageCount: integer("usage_count").notNull().default(0),
    performanceScore: numeric("performance_score", { precision: 8, scale: 2, mode: "number" }).notNull().default(0),
    trendingScore: numeric("trending_score", { precision: 8, scale: 2, mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialAnalyticsTable = pgTable("social_analytics", {
    id: serial("id").primaryKey(),
    contentId: integer("content_id").references(() => socialContentItemsTable.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    impressions: integer("impressions").notNull().default(0),
    reach: integer("reach").notNull().default(0),
    likes: integer("likes").notNull().default(0),
    comments: integer("comments").notNull().default(0),
    shares: integer("shares").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    followersDelta: integer("followers_delta").notNull().default(0),
    measuredAt: timestamp("measured_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialAiSuggestionsTable = pgTable("social_ai_suggestions", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    suggestionType: text("suggestion_type", { enum: ["topic", "headline", "seo", "repurpose", "schedule", "hashtag", "gap"] }).notNull().default("topic"),
    priority: text("priority", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
    description: text("description").notNull(),
    status: text("status", { enum: ["new", "accepted", "dismissed"] }).notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialActivityTable = pgTable("social_activity", {
    id: serial("id").primaryKey(),
    eventType: text("event_type").notNull(),
    message: text("message").notNull(),
    actor: text("actor").notNull().default("OneSocial"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialPeopleTable = pgTable("social_people", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    role: text("role"),
    company: text("company"),
    platform: text("platform").notNull().default("LinkedIn"),
    handle: text("handle"),
    relationshipStage: text("relationship_stage", { enum: ["lead", "peer", "customer", "partner", "community", "mentor"] }).notNull().default("community"),
    notes: text("notes"),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialCirclesTable = pgTable("social_circles", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    purpose: text("purpose"),
    color: text("color").notNull().default("#e11d48"),
    cadence: text("cadence").notNull().default("weekly"),
    memberCount: integer("member_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialFollowupsTable = pgTable("social_followups", {
    id: serial("id").primaryKey(),
    personId: integer("person_id").references(() => socialPeopleTable.id, { onDelete: "set null" }),
    circleId: integer("circle_id").references(() => socialCirclesTable.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    channel: text("channel").notNull().default("LinkedIn"),
    status: text("status", { enum: ["due", "scheduled", "done", "snoozed"] }).notNull().default("due"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const socialAutomationRulesTable = pgTable("social_automation_rules", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    triggerType: text("trigger_type").notNull().default("schedule"),
    triggerConfig: text("trigger_config").notNull().default("Every weekday at 08:00"),
    actionType: text("action_type").notNull().default("publish"),
    actionConfig: text("action_config").notNull().default("Publish approved LinkedIn post"),
    status: text("status", { enum: ["active", "paused", "draft"] }).notNull().default("active"),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertSocialCampaignSchema = createInsertSchema(socialCampaignsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSocialContentItemSchema = createInsertSchema(socialContentItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSocialPlatformVersionSchema = createInsertSchema(socialPlatformVersionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSocialPublishQueueSchema = createInsertSchema(socialPublishQueueTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSocialConnectorSchema = createInsertSchema(socialConnectorsTable).omit({ id: true, createdAt: true });
export const insertSocialHashtagSchema = createInsertSchema(socialHashtagsTable).omit({ id: true, createdAt: true });
export const insertSocialAiSuggestionSchema = createInsertSchema(socialAiSuggestionsTable).omit({ id: true, createdAt: true });
export const insertSocialPersonSchema = createInsertSchema(socialPeopleTable).omit({ id: true, createdAt: true });
export const insertSocialCircleSchema = createInsertSchema(socialCirclesTable).omit({ id: true, createdAt: true });
export const insertSocialFollowupSchema = createInsertSchema(socialFollowupsTable).omit({ id: true, createdAt: true });
export const insertSocialAutomationRuleSchema = createInsertSchema(socialAutomationRulesTable).omit({ id: true, createdAt: true });
