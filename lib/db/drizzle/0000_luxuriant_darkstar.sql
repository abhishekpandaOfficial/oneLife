CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"color" text NOT NULL,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"description" text NOT NULL,
	"date" date NOT NULL,
	"category_id" integer,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"loan_type" text NOT NULL,
	"principal_amount" numeric(14, 2) NOT NULL,
	"outstanding_amount" numeric(14, 2) NOT NULL,
	"interest_rate" numeric(6, 3) NOT NULL,
	"emi_amount" numeric(14, 2) NOT NULL,
	"tenure_months" integer NOT NULL,
	"start_date" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"bank_name" text,
	"bank_logo_url" text,
	"disbursement_doc_url" text,
	"repayment_schedule_doc_url" text,
	"penalty_rate" numeric(6, 3) DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emis" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"amount" numeric(14, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"penalty_amount" numeric(14, 2) DEFAULT 0 NOT NULL,
	"overdue_days" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurances" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"insurance_type" text NOT NULL,
	"provider" text NOT NULL,
	"premium_amount" numeric(14, 2) NOT NULL,
	"coverage_amount" numeric(14, 2) NOT NULL,
	"renewal_date" date NOT NULL,
	"policy_number" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"investment_type" text NOT NULL,
	"invested_amount" numeric(14, 2) NOT NULL,
	"current_value" numeric(14, 2) NOT NULL,
	"purchase_date" date NOT NULL,
	"xirr" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"goal_type" text NOT NULL,
	"target_amount" numeric(14, 2) NOT NULL,
	"current_amount" numeric(14, 2) DEFAULT 0 NOT NULL,
	"target_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"month" text NOT NULL,
	"planned_amount" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_logo_url" text,
	"credit_limit" numeric(14, 2) NOT NULL,
	"outstanding_amount" numeric(14, 2) DEFAULT 0 NOT NULL,
	"due_date" date NOT NULL,
	"minimum_due" numeric(14, 2) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emis" ADD CONSTRAINT "emis_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;