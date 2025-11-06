--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: agent_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.agent_status AS ENUM (
    'active',
    'paused',
    'error',
    'training'
);


--
-- Name: agent_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.agent_type AS ENUM (
    'production_scheduling',
    'inventory_planning',
    'capacity_planning',
    'quality_management',
    'maintenance_planning',
    'supply_chain',
    'demand_forecasting',
    'cost_optimization',
    'safety_compliance',
    'general_assistant'
);


--
-- Name: recommendation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.recommendation_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'completed',
    'in_progress'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agent_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_recommendations (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    priority integer DEFAULT 50,
    confidence integer DEFAULT 80,
    category character varying(50),
    entity_type character varying(50),
    entity_id integer,
    action_type character varying(50),
    action_data jsonb,
    estimated_impact text,
    estimated_time integer,
    reasoning text NOT NULL,
    data_points jsonb,
    alternatives jsonb,
    status public.recommendation_status DEFAULT 'pending'::public.recommendation_status,
    feedback text,
    actual_outcome text,
    recommended_at timestamp without time zone DEFAULT now(),
    responded_at timestamp without time zone,
    implemented_at timestamp without time zone,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: agent_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_recommendations_id_seq OWNED BY public.agent_recommendations.id;


--
-- Name: ai_agent_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_agent_team (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    agent_type public.agent_type NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    specialization jsonb,
    settings jsonb DEFAULT '{}'::jsonb,
    persona text,
    total_recommendations integer DEFAULT 0,
    accepted_recommendations integer DEFAULT 0,
    success_rate numeric DEFAULT '0'::numeric,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: ai_agent_team_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_agent_team_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_agent_team_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_agent_team_id_seq OWNED BY public.ai_agent_team.id;


--
-- Name: ai_memories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_memories (
    id integer NOT NULL,
    user_id character varying(50) NOT NULL,
    type character varying(50) NOT NULL,
    category character varying(100),
    content text NOT NULL,
    context jsonb,
    confidence integer DEFAULT 80,
    importance character varying(20) DEFAULT 'medium'::character varying,
    source character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: ai_memories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_memories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_memories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_memories_id_seq OWNED BY public.ai_memories.id;


--
-- Name: api_key_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_key_usage (
    id integer NOT NULL,
    api_key_id integer NOT NULL,
    endpoint character varying(255) NOT NULL,
    method character varying(10) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    response_status integer,
    response_time_ms integer,
    request_size_bytes integer,
    response_size_bytes integer,
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- Name: api_key_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_key_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_key_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_key_usage_id_seq OWNED BY public.api_key_usage.id;


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    key_id character varying(32) NOT NULL,
    key_hash text NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    user_id integer NOT NULL,
    role_id integer,
    scope jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    last_used_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_keys_id_seq OWNED BY public.api_keys.id;


--
-- Name: company_onboarding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_onboarding (
    id integer NOT NULL,
    company_name character varying(255),
    industry character varying(100),
    company_size character varying(50),
    primary_goals jsonb DEFAULT '[]'::jsonb,
    current_challenges jsonb DEFAULT '[]'::jsonb,
    selected_template character varying(100),
    completed_steps jsonb DEFAULT '[]'::jsonb,
    onboarding_progress integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    user_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: company_onboarding_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_onboarding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_onboarding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_onboarding_id_seq OWNED BY public.company_onboarding.id;


--
-- Name: dashboards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboards (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    role_id integer,
    user_id integer,
    configuration jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: dashboards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dashboards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dashboards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dashboards_id_seq OWNED BY public.dashboards.id;


--
-- Name: microphone_recordings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.microphone_recordings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    blob_hash character varying(64) NOT NULL,
    mime_type character varying(64) NOT NULL,
    sample_rate integer,
    channels smallint DEFAULT 1,
    duration_ms integer NOT NULL,
    size_bytes integer NOT NULL,
    source character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    transcript_text text,
    language character varying(10) DEFAULT 'en'::character varying,
    error_message text,
    audio_data text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    transcribed_at timestamp without time zone
);


--
-- Name: microphone_recordings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.microphone_recordings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: microphone_recordings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.microphone_recordings_id_seq OWNED BY public.microphone_recordings.id;


--
-- Name: oauth_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_clients (
    id integer NOT NULL,
    client_id character varying(64) NOT NULL,
    client_secret text NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    redirect_uris jsonb DEFAULT '[]'::jsonb,
    scopes jsonb DEFAULT '[]'::jsonb,
    grant_types jsonb DEFAULT '["client_credentials"]'::jsonb,
    is_active boolean DEFAULT true,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: oauth_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.oauth_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: oauth_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.oauth_clients_id_seq OWNED BY public.oauth_clients.id;


--
-- Name: oauth_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_tokens (
    id integer NOT NULL,
    client_id integer NOT NULL,
    token_hash text NOT NULL,
    token_type character varying(20) DEFAULT 'Bearer'::character varying,
    scopes jsonb DEFAULT '[]'::jsonb,
    expires_at timestamp without time zone NOT NULL,
    is_revoked boolean DEFAULT false,
    last_used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: oauth_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.oauth_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: oauth_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.oauth_tokens_id_seq OWNED BY public.oauth_tokens.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    feature character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: playbook_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playbook_usage (
    id integer NOT NULL,
    playbook_id integer NOT NULL,
    user_id integer,
    action_type character varying(50) NOT NULL,
    context text,
    effectiveness_rating integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: playbook_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.playbook_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: playbook_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.playbook_usage_id_seq OWNED BY public.playbook_usage.id;


--
-- Name: playbooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playbooks (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    content text NOT NULL,
    category character varying(100),
    tags jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: playbooks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.playbooks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: playbooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.playbooks_id_seq OWNED BY public.playbooks.id;


--
-- Name: production_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production_orders (
    id integer NOT NULL,
    plant_id integer NOT NULL,
    order_number text,
    item_id integer,
    item_name text,
    quantity numeric,
    unit_of_measure character varying(20),
    status character varying(50) DEFAULT 'planned'::character varying,
    priority integer DEFAULT 5,
    due_date timestamp without time zone,
    scheduled_start_date timestamp without time zone,
    scheduled_end_date timestamp without time zone,
    customer_id integer,
    sales_order_id integer,
    description text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: production_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.production_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: production_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.production_orders_id_seq OWNED BY public.production_orders.id;


--
-- Name: pt_manufacturing_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pt_manufacturing_orders (
    id integer NOT NULL,
    publish_date timestamp without time zone NOT NULL,
    instance_id character varying(38) NOT NULL,
    plant_id integer NOT NULL,
    manufacturing_order_id integer,
    order_number text,
    item_id integer,
    item_name text,
    quantity numeric,
    unit_of_measure character varying(20),
    status character varying(50) DEFAULT 'planned'::character varying,
    priority integer DEFAULT 5,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    actual_start_date timestamp without time zone,
    actual_end_date timestamp without time zone,
    due_date timestamp without time zone,
    customer_order_id integer,
    description text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: pt_manufacturing_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pt_manufacturing_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pt_manufacturing_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pt_manufacturing_orders_id_seq OWNED BY public.pt_manufacturing_orders.id;


--
-- Name: ptjoboperations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ptjoboperations (
    id integer NOT NULL,
    job_id integer,
    external_id character varying,
    name character varying NOT NULL,
    description text,
    operation_id character varying,
    base_operation_id character varying,
    required_finish_qty numeric,
    cycle_hrs numeric,
    setup_hours numeric,
    post_processing_hours numeric,
    scheduled_start timestamp without time zone,
    scheduled_end timestamp without time zone,
    percent_finished numeric DEFAULT '0'::numeric,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: ptjoboperations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ptjoboperations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ptjoboperations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ptjoboperations_id_seq OWNED BY public.ptjoboperations.id;


--
-- Name: ptjobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ptjobs (
    id integer NOT NULL,
    external_id character varying,
    name character varying NOT NULL,
    description text,
    priority integer DEFAULT 1,
    need_date_time timestamp without time zone,
    scheduled_status character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: ptjobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ptjobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ptjobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ptjobs_id_seq OWNED BY public.ptjobs.id;


--
-- Name: ptplants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ptplants (
    id integer NOT NULL,
    publish_date timestamp without time zone NOT NULL,
    instance_id character varying(38) NOT NULL,
    plant_id integer NOT NULL,
    name text,
    description text,
    notes text,
    bottleneck_threshold numeric,
    heavy_load_threshold numeric,
    external_id text,
    department_count integer,
    stable_days numeric,
    daily_operating_expense numeric,
    invested_capital numeric,
    annual_percentage_rate numeric,
    address text,
    city text,
    state text,
    country text,
    postal_code text,
    timezone text DEFAULT 'UTC'::text,
    latitude numeric,
    longitude numeric,
    plant_type text DEFAULT 'manufacturing'::text,
    is_active boolean DEFAULT true,
    capacity jsonb DEFAULT '{}'::jsonb,
    operational_metrics jsonb DEFAULT '{}'::jsonb
);


--
-- Name: ptplants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ptplants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ptplants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ptplants_id_seq OWNED BY public.ptplants.id;


--
-- Name: ptresources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ptresources (
    id integer NOT NULL,
    publish_date timestamp without time zone NOT NULL,
    instance_id character varying(38) NOT NULL,
    plant_id integer NOT NULL,
    department_id integer,
    resource_id integer,
    name text,
    description text,
    notes text,
    bottleneck boolean,
    buffer_hours numeric,
    capacity_type text,
    drum boolean,
    overtime_hourly_cost numeric,
    standard_hourly_cost numeric,
    resource_type character varying(50) DEFAULT 'machine'::character varying,
    capacity numeric,
    available_hours numeric,
    efficiency numeric DEFAULT 1.0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: ptresources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ptresources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ptresources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ptresources_id_seq OWNED BY public.ptresources.id;


--
-- Name: recent_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recent_pages (
    id integer NOT NULL,
    user_id integer NOT NULL,
    path character varying(500) NOT NULL,
    title character varying(255),
    visited_at timestamp without time zone DEFAULT now()
);


--
-- Name: recent_pages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recent_pages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recent_pages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recent_pages_id_seq OWNED BY public.recent_pages.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    granted_at timestamp without time zone DEFAULT now()
);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    is_system_role boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: saved_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_schedules (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    schedule_data jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: saved_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.saved_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: saved_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.saved_schedules_id_seq OWNED BY public.saved_schedules.id;


--
-- Name: scheduling_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduling_conversations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255),
    page character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: scheduling_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scheduling_conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scheduling_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scheduling_conversations_id_seq OWNED BY public.scheduling_conversations.id;


--
-- Name: scheduling_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduling_messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: scheduling_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scheduling_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scheduling_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scheduling_messages_id_seq OWNED BY public.scheduling_messages.id;


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    theme character varying(20) DEFAULT 'light'::character varying,
    language character varying(10) DEFAULT 'en'::character varying,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    dashboard_layout jsonb DEFAULT '{}'::jsonb,
    notification_settings jsonb DEFAULT '{}'::jsonb,
    ui_settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_preferences_id_seq OWNED BY public.user_preferences.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now(),
    assigned_by integer
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(50),
    last_name character varying(50),
    password_hash text NOT NULL,
    is_active boolean DEFAULT true,
    active_role_id integer,
    last_login timestamp without time zone,
    avatar text,
    job_title character varying(100),
    department character varying(100),
    phone_number character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: voice_recordings_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voice_recordings_cache (
    id integer NOT NULL,
    text_hash character varying(64) NOT NULL,
    role character varying(50) NOT NULL,
    step_id character varying(100) DEFAULT ''::character varying NOT NULL,
    voice character varying(20) NOT NULL,
    audio_data text NOT NULL,
    mime_type character varying(64) NOT NULL,
    encoding character varying(32),
    sample_rate integer,
    channels smallint DEFAULT 1,
    file_size integer NOT NULL,
    duration integer,
    created_at timestamp without time zone DEFAULT now(),
    last_used_at timestamp without time zone DEFAULT now(),
    usage_count integer DEFAULT 1
);


--
-- Name: voice_recordings_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.voice_recordings_cache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: voice_recordings_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.voice_recordings_cache_id_seq OWNED BY public.voice_recordings_cache.id;


--
-- Name: widget_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.widget_types (
    id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    description text,
    icon character varying(100),
    configurable boolean DEFAULT true,
    data_source_required boolean DEFAULT true,
    default_size jsonb NOT NULL,
    supported_sizes jsonb DEFAULT '[]'::jsonb,
    config_schema jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: widgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.widgets (
    id integer NOT NULL,
    dashboard_id integer NOT NULL,
    type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    "position" jsonb NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: widgets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.widgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: widgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.widgets_id_seq OWNED BY public.widgets.id;


--
-- Name: agent_recommendations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommendations ALTER COLUMN id SET DEFAULT nextval('public.agent_recommendations_id_seq'::regclass);


--
-- Name: ai_agent_team id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent_team ALTER COLUMN id SET DEFAULT nextval('public.ai_agent_team_id_seq'::regclass);


--
-- Name: ai_memories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_memories ALTER COLUMN id SET DEFAULT nextval('public.ai_memories_id_seq'::regclass);


--
-- Name: api_key_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_key_usage ALTER COLUMN id SET DEFAULT nextval('public.api_key_usage_id_seq'::regclass);


--
-- Name: api_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys ALTER COLUMN id SET DEFAULT nextval('public.api_keys_id_seq'::regclass);


--
-- Name: company_onboarding id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_onboarding ALTER COLUMN id SET DEFAULT nextval('public.company_onboarding_id_seq'::regclass);


--
-- Name: dashboards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboards ALTER COLUMN id SET DEFAULT nextval('public.dashboards_id_seq'::regclass);


--
-- Name: microphone_recordings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microphone_recordings ALTER COLUMN id SET DEFAULT nextval('public.microphone_recordings_id_seq'::regclass);


--
-- Name: oauth_clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_clients ALTER COLUMN id SET DEFAULT nextval('public.oauth_clients_id_seq'::regclass);


--
-- Name: oauth_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_tokens ALTER COLUMN id SET DEFAULT nextval('public.oauth_tokens_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: playbook_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbook_usage ALTER COLUMN id SET DEFAULT nextval('public.playbook_usage_id_seq'::regclass);


--
-- Name: playbooks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbooks ALTER COLUMN id SET DEFAULT nextval('public.playbooks_id_seq'::regclass);


--
-- Name: production_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_orders ALTER COLUMN id SET DEFAULT nextval('public.production_orders_id_seq'::regclass);


--
-- Name: pt_manufacturing_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_manufacturing_orders ALTER COLUMN id SET DEFAULT nextval('public.pt_manufacturing_orders_id_seq'::regclass);


--
-- Name: ptjoboperations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjoboperations ALTER COLUMN id SET DEFAULT nextval('public.ptjoboperations_id_seq'::regclass);


--
-- Name: ptjobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjobs ALTER COLUMN id SET DEFAULT nextval('public.ptjobs_id_seq'::regclass);


--
-- Name: ptplants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptplants ALTER COLUMN id SET DEFAULT nextval('public.ptplants_id_seq'::regclass);


--
-- Name: ptresources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptresources ALTER COLUMN id SET DEFAULT nextval('public.ptresources_id_seq'::regclass);


--
-- Name: recent_pages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recent_pages ALTER COLUMN id SET DEFAULT nextval('public.recent_pages_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: saved_schedules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_schedules ALTER COLUMN id SET DEFAULT nextval('public.saved_schedules_id_seq'::regclass);


--
-- Name: scheduling_conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduling_conversations ALTER COLUMN id SET DEFAULT nextval('public.scheduling_conversations_id_seq'::regclass);


--
-- Name: scheduling_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduling_messages ALTER COLUMN id SET DEFAULT nextval('public.scheduling_messages_id_seq'::regclass);


--
-- Name: user_preferences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_preferences_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: voice_recordings_cache id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_recordings_cache ALTER COLUMN id SET DEFAULT nextval('public.voice_recordings_cache_id_seq'::regclass);


--
-- Name: widgets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets ALTER COLUMN id SET DEFAULT nextval('public.widgets_id_seq'::regclass);


--
-- Data for Name: agent_recommendations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agent_recommendations (id, agent_id, user_id, title, description, priority, confidence, category, entity_type, entity_id, action_type, action_data, estimated_impact, estimated_time, reasoning, data_points, alternatives, status, feedback, actual_outcome, recommended_at, responded_at, implemented_at, reviewed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_agent_team; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_agent_team (id, user_id, name, agent_type, description, is_active, specialization, settings, persona, total_recommendations, accepted_recommendations, success_rate, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_memories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_memories (id, user_id, type, category, content, context, confidence, importance, source, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: api_key_usage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_key_usage (id, api_key_id, endpoint, method, ip_address, user_agent, response_status, response_time_ms, request_size_bytes, response_size_bytes, "timestamp") FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_keys (id, key_id, key_hash, name, description, user_id, role_id, scope, is_active, last_used_at, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: company_onboarding; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_onboarding (id, company_name, industry, company_size, primary_goals, current_challenges, selected_template, completed_steps, onboarding_progress, is_completed, user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dashboards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dashboards (id, name, description, is_default, role_id, user_id, configuration, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: microphone_recordings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.microphone_recordings (id, user_id, blob_hash, mime_type, sample_rate, channels, duration_ms, size_bytes, source, status, transcript_text, language, error_message, audio_data, created_at, transcribed_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.oauth_clients (id, client_id, client_secret, name, description, redirect_uris, scopes, grant_types, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oauth_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.oauth_tokens (id, client_id, token_hash, token_type, scopes, expires_at, is_revoked, last_used_at, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, name, feature, action, description, created_at) FROM stdin;
\.


--
-- Data for Name: playbook_usage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.playbook_usage (id, playbook_id, user_id, action_type, context, effectiveness_rating, created_at) FROM stdin;
\.


--
-- Data for Name: playbooks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.playbooks (id, title, description, content, category, tags, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: production_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.production_orders (id, plant_id, order_number, item_id, item_name, quantity, unit_of_measure, status, priority, due_date, scheduled_start_date, scheduled_end_date, customer_id, sales_order_id, description, notes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pt_manufacturing_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pt_manufacturing_orders (id, publish_date, instance_id, plant_id, manufacturing_order_id, order_number, item_id, item_name, quantity, unit_of_measure, status, priority, start_date, end_date, actual_start_date, actual_end_date, due_date, customer_order_id, description, notes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ptjoboperations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ptjoboperations (id, job_id, external_id, name, description, operation_id, base_operation_id, required_finish_qty, cycle_hrs, setup_hours, post_processing_hours, scheduled_start, scheduled_end, percent_finished, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ptjobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ptjobs (id, external_id, name, description, priority, need_date_time, scheduled_status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ptplants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ptplants (id, publish_date, instance_id, plant_id, name, description, notes, bottleneck_threshold, heavy_load_threshold, external_id, department_count, stable_days, daily_operating_expense, invested_capital, annual_percentage_rate, address, city, state, country, postal_code, timezone, latitude, longitude, plant_type, is_active, capacity, operational_metrics) FROM stdin;
\.


--
-- Data for Name: ptresources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ptresources (id, publish_date, instance_id, plant_id, department_id, resource_id, name, description, notes, bottleneck, buffer_hours, capacity_type, drum, overtime_hourly_cost, standard_hourly_cost, resource_type, capacity, available_hours, efficiency, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: recent_pages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recent_pages (id, user_id, path, title, visited_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, role_id, permission_id, granted_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, is_active, is_system_role, created_at) FROM stdin;
\.


--
-- Data for Name: saved_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.saved_schedules (id, user_id, name, description, schedule_data, metadata, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: scheduling_conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scheduling_conversations (id, user_id, title, page, created_at) FROM stdin;
\.


--
-- Data for Name: scheduling_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scheduling_messages (id, conversation_id, role, content, created_at) FROM stdin;
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_preferences (id, user_id, theme, language, timezone, dashboard_layout, notification_settings, ui_settings, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (user_id, role_id, assigned_at, assigned_by) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, first_name, last_name, password_hash, is_active, active_role_id, last_login, avatar, job_title, department, phone_number, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: voice_recordings_cache; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.voice_recordings_cache (id, text_hash, role, step_id, voice, audio_data, mime_type, encoding, sample_rate, channels, file_size, duration, created_at, last_used_at, usage_count) FROM stdin;
\.


--
-- Data for Name: widget_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.widget_types (id, name, category, description, icon, configurable, data_source_required, default_size, supported_sizes, config_schema, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: widgets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.widgets (id, dashboard_id, type, title, "position", config, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Name: agent_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_recommendations_id_seq', 1, false);


--
-- Name: ai_agent_team_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_agent_team_id_seq', 1, false);


--
-- Name: ai_memories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_memories_id_seq', 1, false);


--
-- Name: api_key_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.api_key_usage_id_seq', 1, false);


--
-- Name: api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.api_keys_id_seq', 1, false);


--
-- Name: company_onboarding_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_onboarding_id_seq', 1, false);


--
-- Name: dashboards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dashboards_id_seq', 1, false);


--
-- Name: microphone_recordings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.microphone_recordings_id_seq', 1, false);


--
-- Name: oauth_clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.oauth_clients_id_seq', 1, false);


--
-- Name: oauth_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.oauth_tokens_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 1, false);


--
-- Name: playbook_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.playbook_usage_id_seq', 1, false);


--
-- Name: playbooks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.playbooks_id_seq', 1, false);


--
-- Name: production_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.production_orders_id_seq', 1, false);


--
-- Name: pt_manufacturing_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pt_manufacturing_orders_id_seq', 1, false);


--
-- Name: ptjoboperations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ptjoboperations_id_seq', 1, false);


--
-- Name: ptjobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ptjobs_id_seq', 1, false);


--
-- Name: ptplants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ptplants_id_seq', 1, false);


--
-- Name: ptresources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ptresources_id_seq', 1, false);


--
-- Name: recent_pages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recent_pages_id_seq', 1, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- Name: saved_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.saved_schedules_id_seq', 1, false);


--
-- Name: scheduling_conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.scheduling_conversations_id_seq', 1, false);


--
-- Name: scheduling_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.scheduling_messages_id_seq', 1, false);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_preferences_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: voice_recordings_cache_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.voice_recordings_cache_id_seq', 1, false);


--
-- Name: widgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.widgets_id_seq', 1, false);


--
-- Name: agent_recommendations agent_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommendations
    ADD CONSTRAINT agent_recommendations_pkey PRIMARY KEY (id);


--
-- Name: ai_agent_team ai_agent_team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent_team
    ADD CONSTRAINT ai_agent_team_pkey PRIMARY KEY (id);


--
-- Name: ai_memories ai_memories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_memories
    ADD CONSTRAINT ai_memories_pkey PRIMARY KEY (id);


--
-- Name: api_key_usage api_key_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_key_usage
    ADD CONSTRAINT api_key_usage_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_key_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_id_unique UNIQUE (key_id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: company_onboarding company_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_onboarding
    ADD CONSTRAINT company_onboarding_pkey PRIMARY KEY (id);


--
-- Name: dashboards dashboards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboards
    ADD CONSTRAINT dashboards_pkey PRIMARY KEY (id);


--
-- Name: microphone_recordings microphone_recordings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microphone_recordings
    ADD CONSTRAINT microphone_recordings_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_client_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_clients
    ADD CONSTRAINT oauth_clients_client_id_unique UNIQUE (client_id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_tokens oauth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_tokens
    ADD CONSTRAINT oauth_tokens_pkey PRIMARY KEY (id);


--
-- Name: oauth_tokens oauth_tokens_token_hash_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_tokens
    ADD CONSTRAINT oauth_tokens_token_hash_unique UNIQUE (token_hash);


--
-- Name: permissions permissions_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_unique UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: playbook_usage playbook_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbook_usage
    ADD CONSTRAINT playbook_usage_pkey PRIMARY KEY (id);


--
-- Name: playbooks playbooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbooks
    ADD CONSTRAINT playbooks_pkey PRIMARY KEY (id);


--
-- Name: production_orders production_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_orders
    ADD CONSTRAINT production_orders_pkey PRIMARY KEY (id);


--
-- Name: pt_manufacturing_orders pt_manufacturing_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_manufacturing_orders
    ADD CONSTRAINT pt_manufacturing_orders_pkey PRIMARY KEY (id);


--
-- Name: ptjoboperations ptjoboperations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjoboperations
    ADD CONSTRAINT ptjoboperations_pkey PRIMARY KEY (id);


--
-- Name: ptjobs ptjobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjobs
    ADD CONSTRAINT ptjobs_pkey PRIMARY KEY (id);


--
-- Name: ptplants ptplants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptplants
    ADD CONSTRAINT ptplants_pkey PRIMARY KEY (id);


--
-- Name: ptresources ptresources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptresources
    ADD CONSTRAINT ptresources_pkey PRIMARY KEY (id);


--
-- Name: recent_pages recent_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recent_pages
    ADD CONSTRAINT recent_pages_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_unique UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: saved_schedules saved_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_schedules
    ADD CONSTRAINT saved_schedules_pkey PRIMARY KEY (id);


--
-- Name: scheduling_conversations scheduling_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduling_conversations
    ADD CONSTRAINT scheduling_conversations_pkey PRIMARY KEY (id);


--
-- Name: scheduling_messages scheduling_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduling_messages
    ADD CONSTRAINT scheduling_messages_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: voice_recordings_cache voice_recordings_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_recordings_cache
    ADD CONSTRAINT voice_recordings_cache_pkey PRIMARY KEY (id);


--
-- Name: widget_types widget_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widget_types
    ADD CONSTRAINT widget_types_pkey PRIMARY KEY (id);


--
-- Name: widgets widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT widgets_pkey PRIMARY KEY (id);


--
-- Name: mic_recordings_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mic_recordings_status_idx ON public.microphone_recordings USING btree (status);


--
-- Name: mic_recordings_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mic_recordings_user_idx ON public.microphone_recordings USING btree (user_id);


--
-- Name: unique_user_blob; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_user_blob ON public.microphone_recordings USING btree (user_id, blob_hash);


--
-- Name: unique_voice_cache; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_voice_cache ON public.voice_recordings_cache USING btree (text_hash, voice, role, step_id);


--
-- Name: voice_cache_last_used_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX voice_cache_last_used_idx ON public.voice_recordings_cache USING btree (last_used_at);


--
-- Name: agent_recommendations agent_recommendations_agent_id_ai_agent_team_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommendations
    ADD CONSTRAINT agent_recommendations_agent_id_ai_agent_team_id_fk FOREIGN KEY (agent_id) REFERENCES public.ai_agent_team(id);


--
-- Name: agent_recommendations agent_recommendations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommendations
    ADD CONSTRAINT agent_recommendations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ai_agent_team ai_agent_team_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent_team
    ADD CONSTRAINT ai_agent_team_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: api_key_usage api_key_usage_api_key_id_api_keys_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_key_usage
    ADD CONSTRAINT api_key_usage_api_key_id_api_keys_id_fk FOREIGN KEY (api_key_id) REFERENCES public.api_keys(id);


--
-- Name: api_keys api_keys_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: api_keys api_keys_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: company_onboarding company_onboarding_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_onboarding
    ADD CONSTRAINT company_onboarding_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: dashboards dashboards_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboards
    ADD CONSTRAINT dashboards_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: dashboards dashboards_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboards
    ADD CONSTRAINT dashboards_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: microphone_recordings microphone_recordings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microphone_recordings
    ADD CONSTRAINT microphone_recordings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: oauth_clients oauth_clients_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_clients
    ADD CONSTRAINT oauth_clients_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: oauth_tokens oauth_tokens_client_id_oauth_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_tokens
    ADD CONSTRAINT oauth_tokens_client_id_oauth_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.oauth_clients(id);


--
-- Name: playbook_usage playbook_usage_playbook_id_playbooks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbook_usage
    ADD CONSTRAINT playbook_usage_playbook_id_playbooks_id_fk FOREIGN KEY (playbook_id) REFERENCES public.playbooks(id);


--
-- Name: playbook_usage playbook_usage_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbook_usage
    ADD CONSTRAINT playbook_usage_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: playbooks playbooks_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbooks
    ADD CONSTRAINT playbooks_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: ptjoboperations ptjoboperations_job_id_ptjobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjoboperations
    ADD CONSTRAINT ptjoboperations_job_id_ptjobs_id_fk FOREIGN KEY (job_id) REFERENCES public.ptjobs(id);


--
-- Name: recent_pages recent_pages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recent_pages
    ADD CONSTRAINT recent_pages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: role_permissions role_permissions_permission_id_permissions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_permissions_id_fk FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: role_permissions role_permissions_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: saved_schedules saved_schedules_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_schedules
    ADD CONSTRAINT saved_schedules_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: scheduling_conversations scheduling_conversations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduling_conversations
    ADD CONSTRAINT scheduling_conversations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: scheduling_messages scheduling_messages_conversation_id_scheduling_conversations_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduling_messages
    ADD CONSTRAINT scheduling_messages_conversation_id_scheduling_conversations_id FOREIGN KEY (conversation_id) REFERENCES public.scheduling_conversations(id);


--
-- Name: user_preferences user_preferences_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_assigned_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_users_id_fk FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_roles user_roles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: widgets widgets_dashboard_id_dashboards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT widgets_dashboard_id_dashboards_id_fk FOREIGN KEY (dashboard_id) REFERENCES public.dashboards(id);


--
-- PostgreSQL database dump complete
--

