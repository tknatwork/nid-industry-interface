CREATE TABLE "campuses" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"programmes_offered_json" text NOT NULL,
	"contact_email" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "discipline_version_history" (
	"id" text PRIMARY KEY NOT NULL,
	"discipline_id" text NOT NULL,
	"version" integer NOT NULL,
	"snapshot_json" text NOT NULL,
	"changed_by" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disciplines" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description_md" text NOT NULL,
	"campus_ids_json" text NOT NULL,
	"programme" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"accent_token_name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "disciplines_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "job_title_mappings" (
	"raw_title" text PRIMARY KEY NOT NULL,
	"target_discipline_ids_json" text NOT NULL,
	"source" text NOT NULL,
	"confidence" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cycles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"campus_ids_json" text NOT NULL,
	"status" text NOT NULL,
	"open_date" timestamp with time zone NOT NULL,
	"jd_upload_deadline" timestamp with time zone NOT NULL,
	"browse_window_opens" timestamp with time zone NOT NULL,
	"shortlist_deadline" timestamp with time zone NOT NULL,
	"interview_window_start" timestamp with time zone NOT NULL,
	"interview_window_end" timestamp with time zone NOT NULL,
	"offer_deadline" timestamp with time zone NOT NULL,
	"wave_time_window_days" integer DEFAULT 7 NOT NULL,
	"archive_date" timestamp with time zone NOT NULL,
	"participation_fee_paise" bigint NOT NULL,
	"gp_fee_per_intern_paise" bigint NOT NULL,
	"late_registration_fee_paise" bigint,
	"config_json" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eligibility_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"cycle_id" text NOT NULL,
	"discipline_ids_json" text NOT NULL,
	"min_semester" integer,
	"max_semester" integer,
	"min_cgpa" integer,
	"ppo_lock_exempt" text DEFAULT 'false' NOT NULL,
	"custom_json" text
);
--> statement-breakpoint
CREATE TABLE "stipend_floor_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"cycle_id" text NOT NULL,
	"discipline_ids_json" text NOT NULL,
	"programme" text NOT NULL,
	"role_type" text NOT NULL,
	"floor_paise" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiter_id" text,
	"cycle_id" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text NOT NULL,
	"status" text NOT NULL,
	"status_history_json" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiter_id" text NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_engagements" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiter_id" text NOT NULL,
	"cycle_id" text NOT NULL,
	"fee_paid_at" timestamp with time zone,
	"status" text NOT NULL,
	"meetings_with_placement_head" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_health" (
	"recruiter_id" text PRIMARY KEY NOT NULL,
	"score" integer DEFAULT 50 NOT NULL,
	"band" text DEFAULT 'good' NOT NULL,
	"last_computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiters" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"sector" text NOT NULL,
	"gst" text NOT NULL,
	"registration_number" text NOT NULL,
	"corporate_email" text NOT NULL,
	"website_url" text,
	"category" text NOT NULL,
	"member_since" timestamp with time zone NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recruiters_gst_unique" UNIQUE("gst"),
	CONSTRAINT "recruiters_corporate_email_unique" UNIQUE("corporate_email")
);
--> statement-breakpoint
CREATE TABLE "jds" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiter_id" text NOT NULL,
	"cycle_id" text NOT NULL,
	"replaces_jd_id" text,
	"status" text NOT NULL,
	"title" text NOT NULL,
	"role_type" text NOT NULL,
	"location" text NOT NULL,
	"work_mode" text NOT NULL,
	"positions" integer NOT NULL,
	"target_start_date" timestamp with time zone,
	"base_min_paise" bigint,
	"base_max_paise" bigint,
	"stipend_paise" bigint,
	"variable_component" text,
	"equity_component" text,
	"joining_bonus_paise" bigint,
	"relocation_paise" bigint,
	"skills_required_json" text DEFAULT '[]' NOT NULL,
	"responsibilities_json" text DEFAULT '{}' NOT NULL,
	"deliverables_json" text DEFAULT '[]' NOT NULL,
	"supplementary_prose_md" text,
	"target_discipline_ids_json" text DEFAULT '[]' NOT NULL,
	"interview_rounds_json" text DEFAULT '[]' NOT NULL,
	"drafted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "student_conduct_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"cycle_id" text NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"rationale" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"appeal_status" text
);
--> statement-breakpoint
CREATE TABLE "student_cycle_opt_ins" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"cycle_id" text NOT NULL,
	"opted_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"code_of_conduct_accepted" boolean DEFAULT false NOT NULL,
	"code_of_conduct_accepted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"campus_id" text NOT NULL,
	"discipline_id" text NOT NULL,
	"programme" text NOT NULL,
	"semester" integer NOT NULL,
	"batch_year" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"portfolio_url" text,
	"cv_url" text,
	"cgpa_cents" integer,
	"has_ppo_lock" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"jd_id" text NOT NULL,
	"status" text NOT NULL,
	"cover_note_md" text,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shortlists" (
	"id" text PRIMARY KEY NOT NULL,
	"jd_id" text NOT NULL,
	"student_id" text NOT NULL,
	"recruiter_note_md" text NOT NULL,
	"shortlisted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"invited_to_rounds_json" text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slots" (
	"id" text PRIMARY KEY NOT NULL,
	"jd_id" text,
	"day" timestamp with time zone NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"capacity" integer NOT NULL,
	"discipline_hint_id" text,
	"meeting_link_url" text
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"jd_id" text NOT NULL,
	"student_id" text NOT NULL,
	"wave" integer NOT NULL,
	"ctc_paise" bigint,
	"stipend_paise" bigint,
	"location" text NOT NULL,
	"role" text NOT NULL,
	"joining_date" timestamp with time zone NOT NULL,
	"offer_letter_pdf_url" text NOT NULL,
	"status" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"window_expires_at" timestamp with time zone NOT NULL,
	"responded_at" timestamp with time zone,
	"response_reason" text
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"target_table" text NOT NULL,
	"target_id" text NOT NULL,
	"before_json" text,
	"after_json" text,
	"trace_id" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_log" USING btree ("target_table","target_id","at");--> statement-breakpoint
CREATE INDEX "audit_trace_idx" ON "audit_log" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_type","actor_id","at");