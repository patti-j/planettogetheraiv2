CREATE TYPE "public"."agent_status" AS ENUM('active', 'paused', 'error', 'training');--> statement-breakpoint
CREATE TYPE "public"."agent_type" AS ENUM('production_scheduling', 'inventory_planning', 'capacity_planning', 'quality_management', 'maintenance_planning', 'supply_chain', 'demand_forecasting', 'cost_optimization', 'safety_compliance', 'general_assistant');--> statement-breakpoint
CREATE TYPE "public"."recommendation_status" AS ENUM('pending', 'accepted', 'rejected', 'completed', 'in_progress');--> statement-breakpoint
CREATE TABLE "agent_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(100),
	"agent_id" integer,
	"agent_type" varchar(50) NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" integer,
	"action_description" text NOT NULL,
	"reasoning" text,
	"user_prompt" text,
	"before_state" jsonb,
	"after_state" jsonb,
	"undo_instructions" text,
	"batch_id" varchar(100),
	"execution_time" integer,
	"success" boolean DEFAULT true,
	"error_message" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"priority" integer DEFAULT 50,
	"confidence" integer DEFAULT 80,
	"category" varchar(50),
	"entity_type" varchar(50),
	"entity_id" integer,
	"action_type" varchar(50),
	"action_data" jsonb,
	"estimated_impact" text,
	"estimated_time" integer,
	"reasoning" text NOT NULL,
	"data_points" jsonb,
	"alternatives" jsonb,
	"status" "recommendation_status" DEFAULT 'pending',
	"feedback" text,
	"actual_outcome" text,
	"recommended_at" timestamp DEFAULT now(),
	"responded_at" timestamp,
	"implemented_at" timestamp,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_agent_team" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"agent_type" "agent_type" NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"specialization" jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"persona" text,
	"total_recommendations" integer DEFAULT 0,
	"accepted_recommendations" integer DEFAULT 0,
	"success_rate" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_memories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"type" varchar(50) NOT NULL,
	"category" varchar(100),
	"content" text NOT NULL,
	"context" jsonb,
	"confidence" integer DEFAULT 80,
	"importance" varchar(20) DEFAULT 'medium',
	"source" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_onboarding" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(255),
	"industry" varchar(100),
	"company_size" varchar(50),
	"primary_goals" jsonb DEFAULT '[]'::jsonb,
	"current_challenges" jsonb DEFAULT '[]'::jsonb,
	"selected_template" varchar(100),
	"completed_steps" jsonb DEFAULT '[]'::jsonb,
	"onboarding_progress" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"user_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ptjoboperations" (
	"id" serial PRIMARY KEY NOT NULL,
	"publish_date" timestamp NOT NULL,
	"instance_id" varchar(38) NOT NULL,
	"plant_id" integer NOT NULL,
	"manufacturing_order_id" integer,
	"operation_id" integer,
	"sequence_number" integer,
	"operation_name" text,
	"description" text,
	"duration" integer,
	"setup_time" integer DEFAULT 0,
	"process_time" integer,
	"teardown_time" integer DEFAULT 0,
	"queue_time" integer DEFAULT 0,
	"move_time" integer DEFAULT 0,
	"wait_time" integer DEFAULT 0,
	"resource_id" integer,
	"work_center_name" text,
	"status" varchar(50) DEFAULT 'planned',
	"start_date" timestamp,
	"end_date" timestamp,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pt_manufacturing_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"publish_date" timestamp NOT NULL,
	"instance_id" varchar(38) NOT NULL,
	"plant_id" integer NOT NULL,
	"manufacturing_order_id" integer,
	"order_number" text,
	"item_id" integer,
	"item_name" text,
	"quantity" numeric,
	"unit_of_measure" varchar(20),
	"status" varchar(50) DEFAULT 'planned',
	"priority" integer DEFAULT 5,
	"start_date" timestamp,
	"end_date" timestamp,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"due_date" timestamp,
	"customer_order_id" integer,
	"description" text,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"feature" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ptplants" (
	"id" serial PRIMARY KEY NOT NULL,
	"publish_date" timestamp NOT NULL,
	"instance_id" varchar(38) NOT NULL,
	"plant_id" integer NOT NULL,
	"name" text,
	"description" text,
	"notes" text,
	"bottleneck_threshold" numeric,
	"heavy_load_threshold" numeric,
	"external_id" text,
	"department_count" integer,
	"stable_days" numeric,
	"daily_operating_expense" numeric,
	"invested_capital" numeric,
	"annual_percentage_rate" numeric,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"postal_code" text,
	"timezone" text DEFAULT 'UTC',
	"latitude" numeric,
	"longitude" numeric,
	"plant_type" text DEFAULT 'manufacturing',
	"is_active" boolean DEFAULT true,
	"capacity" jsonb DEFAULT '{}'::jsonb,
	"operational_metrics" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "playbook_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"playbook_id" integer NOT NULL,
	"user_id" integer,
	"action_type" varchar(50) NOT NULL,
	"context" text,
	"effectiveness_rating" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "playbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"category" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "production_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"plant_id" integer NOT NULL,
	"order_number" text,
	"item_id" integer,
	"item_name" text,
	"quantity" numeric,
	"unit_of_measure" varchar(20),
	"status" varchar(50) DEFAULT 'planned',
	"priority" integer DEFAULT 5,
	"due_date" timestamp,
	"scheduled_start_date" timestamp,
	"scheduled_end_date" timestamp,
	"customer_id" integer,
	"sales_order_id" integer,
	"description" text,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ptresources" (
	"id" serial PRIMARY KEY NOT NULL,
	"publish_date" timestamp NOT NULL,
	"instance_id" varchar(38) NOT NULL,
	"plant_id" integer NOT NULL,
	"department_id" integer,
	"resource_id" integer,
	"name" text,
	"description" text,
	"notes" text,
	"bottleneck" boolean,
	"buffer_hours" numeric,
	"capacity_type" text,
	"drum" boolean,
	"overtime_hourly_cost" numeric,
	"standard_hourly_cost" numeric,
	"resource_type" varchar(50) DEFAULT 'machine',
	"capacity" numeric,
	"available_hours" numeric,
	"efficiency" numeric DEFAULT '1.0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recent_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"path" varchar(500) NOT NULL,
	"title" varchar(255),
	"visited_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"granted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"is_system_role" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "scheduling_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255),
	"page" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scheduling_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"theme" varchar(20) DEFAULT 'light',
	"language" varchar(10) DEFAULT 'en',
	"timezone" varchar(50) DEFAULT 'UTC',
	"dashboard_layout" jsonb DEFAULT '{}'::jsonb,
	"notification_settings" jsonb DEFAULT '{}'::jsonb,
	"ui_settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"assigned_by" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"active_role_id" integer,
	"last_login" timestamp,
	"avatar" text,
	"job_title" varchar(100),
	"department" varchar(100),
	"phone_number" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_agent_id_ai_agent_team_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agent_team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_recommendations" ADD CONSTRAINT "agent_recommendations_agent_id_ai_agent_team_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agent_team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_recommendations" ADD CONSTRAINT "agent_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent_team" ADD CONSTRAINT "ai_agent_team_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_onboarding" ADD CONSTRAINT "company_onboarding_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_usage" ADD CONSTRAINT "playbook_usage_playbook_id_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_usage" ADD CONSTRAINT "playbook_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recent_pages" ADD CONSTRAINT "recent_pages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduling_conversations" ADD CONSTRAINT "scheduling_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduling_messages" ADD CONSTRAINT "scheduling_messages_conversation_id_scheduling_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."scheduling_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;