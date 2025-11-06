--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

-- Started on 2025-11-06 19:53:08 UTC

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
-- TOC entry 1062 (class 1247 OID 106506)
-- Name: agent_connection_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.agent_connection_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'revoked',
    'rate_limited'
);


--
-- TOC entry 1059 (class 1247 OID 106497)
-- Name: agent_connection_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.agent_connection_type AS ENUM (
    'api_key',
    'oauth',
    'webhook',
    'websocket'
);


--
-- TOC entry 1200 (class 1247 OID 466945)
-- Name: llm_provider_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.llm_provider_type AS ENUM (
    'openai',
    'ollama',
    'custom'
);


--
-- TOC entry 1095 (class 1247 OID 270337)
-- Name: recurrence_pattern; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.recurrence_pattern AS ENUM (
    'none',
    'daily',
    'weekly',
    'monthly',
    'yearly'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 262 (class 1259 OID 106547)
-- Name: agent_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_actions (
    id integer NOT NULL,
    agent_connection_id integer NOT NULL,
    action_type character varying(100) NOT NULL,
    endpoint character varying(255),
    method character varying(10),
    request_payload jsonb,
    response_status integer,
    response_payload jsonb,
    error_message text,
    execution_time_ms integer,
    affected_entities jsonb,
    ip_address character varying(45),
    session_id character varying(64),
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- TOC entry 261 (class 1259 OID 106546)
-- Name: agent_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4401 (class 0 OID 0)
-- Dependencies: 261
-- Name: agent_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_actions_id_seq OWNED BY public.agent_actions.id;


--
-- TOC entry 359 (class 1259 OID 491585)
-- Name: agent_activity_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_activity_tracking (
    agent_name character varying(100) NOT NULL,
    last_activity_time timestamp without time zone,
    status character varying(20) DEFAULT 'idle'::character varying,
    activity_count integer DEFAULT 0,
    last_action text,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 268 (class 1259 OID 106604)
-- Name: agent_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_alerts (
    id integer NOT NULL,
    agent_connection_id integer NOT NULL,
    alert_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    message text NOT NULL,
    details jsonb,
    is_acknowledged boolean DEFAULT false,
    acknowledged_by integer,
    acknowledged_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 267 (class 1259 OID 106603)
-- Name: agent_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 267
-- Name: agent_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_alerts_id_seq OWNED BY public.agent_alerts.id;


--
-- TOC entry 260 (class 1259 OID 106518)
-- Name: agent_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_connections (
    id integer NOT NULL,
    agent_id character varying(64) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    connection_type public.agent_connection_type NOT NULL,
    status public.agent_connection_status DEFAULT 'active'::public.agent_connection_status NOT NULL,
    api_key_id integer,
    oauth_client_id integer,
    ip_address character varying(45),
    user_agent text,
    permissions jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    rate_limit_per_minute integer DEFAULT 60,
    rate_limit_per_hour integer DEFAULT 1000,
    is_enabled boolean DEFAULT true,
    last_seen_at timestamp without time zone,
    connected_at timestamp without time zone,
    disconnected_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 259 (class 1259 OID 106517)
-- Name: agent_connections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_connections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4403 (class 0 OID 0)
-- Dependencies: 259
-- Name: agent_connections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_connections_id_seq OWNED BY public.agent_connections.id;


--
-- TOC entry 264 (class 1259 OID 106562)
-- Name: agent_metrics_hourly; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_metrics_hourly (
    id integer NOT NULL,
    agent_connection_id integer NOT NULL,
    hour_timestamp timestamp without time zone NOT NULL,
    total_requests integer DEFAULT 0,
    successful_requests integer DEFAULT 0,
    failed_requests integer DEFAULT 0,
    avg_response_time_ms numeric(10,2),
    max_response_time_ms integer,
    min_response_time_ms integer,
    total_data_transferred_kb numeric(15,2),
    unique_endpoints integer,
    error_rate numeric(5,4),
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 263 (class 1259 OID 106561)
-- Name: agent_metrics_hourly_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_metrics_hourly_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4404 (class 0 OID 0)
-- Dependencies: 263
-- Name: agent_metrics_hourly_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_metrics_hourly_id_seq OWNED BY public.agent_metrics_hourly.id;


--
-- TOC entry 266 (class 1259 OID 106578)
-- Name: agent_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_policies (
    id integer NOT NULL,
    agent_connection_id integer NOT NULL,
    policy_type character varying(50) NOT NULL,
    policy_config jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_by integer,
    approved_by integer,
    created_at timestamp without time zone DEFAULT now(),
    activated_at timestamp without time zone,
    deactivated_at timestamp without time zone
);


--
-- TOC entry 265 (class 1259 OID 106577)
-- Name: agent_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4405 (class 0 OID 0)
-- Dependencies: 265
-- Name: agent_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_policies_id_seq OWNED BY public.agent_policies.id;


--
-- TOC entry 358 (class 1259 OID 491551)
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
    status character varying(20) DEFAULT 'pending'::character varying,
    applied_at timestamp without time zone,
    applied_by integer,
    dismissed_at timestamp without time zone,
    dismissed_by integer,
    dismissal_reason text,
    implementation_result jsonb,
    reasoning text,
    data_support jsonb,
    impact text,
    recommended_action jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    data_points jsonb,
    alternatives jsonb,
    feedback text,
    actual_outcome text,
    recommended_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    responded_at timestamp without time zone,
    implemented_at timestamp without time zone,
    reviewed_at timestamp without time zone
);


--
-- TOC entry 357 (class 1259 OID 491550)
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
-- TOC entry 4406 (class 0 OID 0)
-- Dependencies: 357
-- Name: agent_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_recommendations_id_seq OWNED BY public.agent_recommendations.id;


--
-- TOC entry 356 (class 1259 OID 491535)
-- Name: ai_agent_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_agent_team (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    agent_type character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    specialization jsonb,
    settings jsonb DEFAULT '{}'::jsonb,
    persona text,
    total_recommendations integer DEFAULT 0,
    accepted_recommendations integer DEFAULT 0,
    success_rate numeric DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 355 (class 1259 OID 491534)
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
-- TOC entry 4407 (class 0 OID 0)
-- Dependencies: 355
-- Name: ai_agent_team_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_agent_team_id_seq OWNED BY public.ai_agent_team.id;


--
-- TOC entry 288 (class 1259 OID 278579)
-- Name: algorithm_deployments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.algorithm_deployments (
    id integer NOT NULL,
    algorithm_id integer NOT NULL,
    target_module character varying(100) NOT NULL,
    environment character varying(50) NOT NULL,
    version character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    configuration jsonb DEFAULT '{}'::jsonb,
    deployed_by integer,
    deployed_at timestamp without time zone,
    metrics jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 287 (class 1259 OID 278578)
-- Name: algorithm_deployments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.algorithm_deployments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4408 (class 0 OID 0)
-- Dependencies: 287
-- Name: algorithm_deployments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.algorithm_deployments_id_seq OWNED BY public.algorithm_deployments.id;


--
-- TOC entry 290 (class 1259 OID 278602)
-- Name: algorithm_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.algorithm_feedback (
    id integer NOT NULL,
    algorithm_name character varying(100) NOT NULL,
    algorithm_version character varying(20),
    title character varying(200) NOT NULL,
    description text,
    feedback_type character varying(50) NOT NULL,
    category character varying(50) NOT NULL,
    severity character varying(20),
    priority character varying(20),
    plant_id integer,
    notes text,
    execution_context jsonb DEFAULT '{}'::jsonb,
    expected_result text,
    actual_result text,
    suggested_improvement text,
    reproducible boolean DEFAULT false,
    reproduction_steps jsonb DEFAULT '[]'::jsonb,
    tags jsonb DEFAULT '[]'::jsonb,
    status character varying(20) DEFAULT 'new'::character varying,
    resolution_notes text,
    submitted_by integer,
    resolved_by integer,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 292 (class 1259 OID 278629)
-- Name: algorithm_feedback_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.algorithm_feedback_comments (
    id integer NOT NULL,
    feedback_id integer NOT NULL,
    comment text NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 291 (class 1259 OID 278628)
-- Name: algorithm_feedback_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.algorithm_feedback_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4409 (class 0 OID 0)
-- Dependencies: 291
-- Name: algorithm_feedback_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.algorithm_feedback_comments_id_seq OWNED BY public.algorithm_feedback_comments.id;


--
-- TOC entry 289 (class 1259 OID 278601)
-- Name: algorithm_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.algorithm_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4410 (class 0 OID 0)
-- Dependencies: 289
-- Name: algorithm_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.algorithm_feedback_id_seq OWNED BY public.algorithm_feedback.id;


--
-- TOC entry 294 (class 1259 OID 278649)
-- Name: algorithm_feedback_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.algorithm_feedback_votes (
    id integer NOT NULL,
    feedback_id integer NOT NULL,
    user_id integer NOT NULL,
    vote_type character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 293 (class 1259 OID 278648)
-- Name: algorithm_feedback_votes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.algorithm_feedback_votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4411 (class 0 OID 0)
-- Dependencies: 293
-- Name: algorithm_feedback_votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.algorithm_feedback_votes_id_seq OWNED BY public.algorithm_feedback_votes.id;


--
-- TOC entry 304 (class 1259 OID 278764)
-- Name: algorithm_governance_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.algorithm_governance_approvals (
    id integer NOT NULL,
    plant_id integer NOT NULL,
    algorithm_version_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    approval_level character varying(20) NOT NULL,
    approved_by integer,
    approved_at timestamp without time zone,
    approval_notes text,
    effective_date timestamp without time zone,
    expiration_date timestamp without time zone,
    priority integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 303 (class 1259 OID 278763)
-- Name: algorithm_governance_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.algorithm_governance_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4412 (class 0 OID 0)
-- Dependencies: 303
-- Name: algorithm_governance_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.algorithm_governance_approvals_id_seq OWNED BY public.algorithm_governance_approvals.id;


--
-- TOC entry 286 (class 1259 OID 278557)
-- Name: algorithm_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.algorithm_tests (
    id integer NOT NULL,
    algorithm_id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    test_type character varying(50) NOT NULL,
    configuration jsonb DEFAULT '{}'::jsonb,
    results jsonb,
    status character varying(20) DEFAULT 'pending'::character varying,
    execution_time_ms integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 285 (class 1259 OID 278556)
-- Name: algorithm_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.algorithm_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4413 (class 0 OID 0)
-- Dependencies: 285
-- Name: algorithm_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.algorithm_tests_id_seq OWNED BY public.algorithm_tests.id;


--
-- TOC entry 254 (class 1259 OID 90129)
-- Name: api_key_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_key_usage (
    id integer NOT NULL,
    api_key_id integer NOT NULL,
    endpoint character varying(500) NOT NULL,
    method character varying(10) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    response_status integer,
    used_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 253 (class 1259 OID 90128)
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
-- TOC entry 4414 (class 0 OID 0)
-- Dependencies: 253
-- Name: api_key_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_key_usage_id_seq OWNED BY public.api_key_usage.id;


--
-- TOC entry 252 (class 1259 OID 90113)
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    key_hash character varying(255) NOT NULL,
    key_prefix character varying(20) NOT NULL,
    user_id integer NOT NULL,
    role_id integer,
    permissions text[],
    expires_at timestamp without time zone,
    last_used_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 251 (class 1259 OID 90112)
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
-- TOC entry 4415 (class 0 OID 0)
-- Dependencies: 251
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_keys_id_seq OWNED BY public.api_keys.id;


--
-- TOC entry 336 (class 1259 OID 442407)
-- Name: atpcapacitysnapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atpcapacitysnapshots (
    id integer NOT NULL,
    resource_id integer,
    item_id integer,
    snapshot_date timestamp without time zone NOT NULL,
    total_capacity numeric,
    available_capacity numeric,
    reserved_capacity numeric,
    utilization_percentage numeric,
    forecast_demand numeric,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 335 (class 1259 OID 442406)
-- Name: atpcapacitysnapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.atpcapacitysnapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4416 (class 0 OID 0)
-- Dependencies: 335
-- Name: atpcapacitysnapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.atpcapacitysnapshots_id_seq OWNED BY public.atpcapacitysnapshots.id;


--
-- TOC entry 330 (class 1259 OID 442369)
-- Name: atpmaterialreservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atpmaterialreservations (
    id integer NOT NULL,
    reservation_number character varying(255) NOT NULL,
    item_id integer,
    required_quantity numeric NOT NULL,
    reserved_quantity numeric,
    unit_of_measure character varying(50),
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    priority character varying(50) DEFAULT 'medium'::character varying,
    job_id integer,
    order_number character varying(255),
    description text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer
);


--
-- TOC entry 329 (class 1259 OID 442368)
-- Name: atpmaterialreservations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.atpmaterialreservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4417 (class 0 OID 0)
-- Dependencies: 329
-- Name: atpmaterialreservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.atpmaterialreservations_id_seq OWNED BY public.atpmaterialreservations.id;


--
-- TOC entry 334 (class 1259 OID 442397)
-- Name: atpreservationhistory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atpreservationhistory (
    id integer NOT NULL,
    reservation_number character varying(255) NOT NULL,
    reservation_type character varying(50) NOT NULL,
    change_type character varying(50) NOT NULL,
    old_values json,
    new_values json,
    reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


--
-- TOC entry 333 (class 1259 OID 442396)
-- Name: atpreservationhistory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.atpreservationhistory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4418 (class 0 OID 0)
-- Dependencies: 333
-- Name: atpreservationhistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.atpreservationhistory_id_seq OWNED BY public.atpreservationhistory.id;


--
-- TOC entry 332 (class 1259 OID 442384)
-- Name: atpresourcereservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atpresourcereservations (
    id integer NOT NULL,
    reservation_number character varying(255) NOT NULL,
    resource_id integer,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    required_capacity numeric,
    status character varying(50) DEFAULT 'pending'::character varying,
    priority character varying(50) DEFAULT 'medium'::character varying,
    job_id integer,
    order_number character varying(255),
    description text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer
);


--
-- TOC entry 331 (class 1259 OID 442383)
-- Name: atpresourcereservations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.atpresourcereservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4419 (class 0 OID 0)
-- Dependencies: 331
-- Name: atpresourcereservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.atpresourcereservations_id_seq OWNED BY public.atpresourcereservations.id;


--
-- TOC entry 326 (class 1259 OID 368682)
-- Name: autonomous_optimization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.autonomous_optimization (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    plant_id integer NOT NULL,
    is_enabled boolean DEFAULT false,
    optimization_objective character varying(100) DEFAULT 'maximize_weighted_kpis'::character varying,
    target_kpi_ids integer[],
    allowed_algorithms character varying[],
    current_algorithm character varying(50) DEFAULT 'ASAP'::character varying,
    auto_algorithm_selection boolean DEFAULT true,
    enable_parameter_tuning boolean DEFAULT true,
    learning_mode character varying(50) DEFAULT 'adaptive'::character varying,
    performance_threshold numeric DEFAULT 0.85,
    evaluation_period_minutes integer DEFAULT 60,
    last_optimization_at timestamp without time zone,
    total_optimizations integer DEFAULT 0,
    successful_optimizations integer DEFAULT 0,
    last_performance_score numeric,
    learning_history jsonb,
    parameter_history jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 325 (class 1259 OID 368681)
-- Name: autonomous_optimization_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.autonomous_optimization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4420 (class 0 OID 0)
-- Dependencies: 325
-- Name: autonomous_optimization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.autonomous_optimization_id_seq OWNED BY public.autonomous_optimization.id;


--
-- TOC entry 280 (class 1259 OID 270348)
-- Name: calendars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendars (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    start_time character varying(5) DEFAULT '08:00'::character varying NOT NULL,
    end_time character varying(5) DEFAULT '17:00'::character varying NOT NULL,
    monday boolean DEFAULT true NOT NULL,
    tuesday boolean DEFAULT true NOT NULL,
    wednesday boolean DEFAULT true NOT NULL,
    thursday boolean DEFAULT true NOT NULL,
    friday boolean DEFAULT true NOT NULL,
    saturday boolean DEFAULT false NOT NULL,
    sunday boolean DEFAULT false NOT NULL,
    time_zone character varying(50) DEFAULT 'UTC'::character varying NOT NULL,
    resource_id integer,
    job_id integer,
    plant_id integer,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by integer
);


--
-- TOC entry 279 (class 1259 OID 270347)
-- Name: calendars_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.calendars_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4421 (class 0 OID 0)
-- Dependencies: 279
-- Name: calendars_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.calendars_id_seq OWNED BY public.calendars.id;


--
-- TOC entry 320 (class 1259 OID 352272)
-- Name: capabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.capabilities (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) DEFAULT 'skill'::character varying,
    level integer,
    valid_from timestamp without time zone,
    valid_to timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 319 (class 1259 OID 352271)
-- Name: capabilities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.capabilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4422 (class 0 OID 0)
-- Dependencies: 319
-- Name: capabilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.capabilities_id_seq OWNED BY public.capabilities.id;


--
-- TOC entry 232 (class 1259 OID 57367)
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
-- TOC entry 231 (class 1259 OID 57366)
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
-- TOC entry 4423 (class 0 OID 0)
-- Dependencies: 231
-- Name: company_onboarding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_onboarding_id_seq OWNED BY public.company_onboarding.id;


--
-- TOC entry 246 (class 1259 OID 81988)
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
-- TOC entry 245 (class 1259 OID 81987)
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
-- TOC entry 4424 (class 0 OID 0)
-- Dependencies: 245
-- Name: dashboards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dashboards_id_seq OWNED BY public.dashboards.id;


--
-- TOC entry 346 (class 1259 OID 458829)
-- Name: ddmrp_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ddmrp_alerts (
    id integer NOT NULL,
    buffer_id integer NOT NULL,
    alert_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    message text NOT NULL,
    details jsonb,
    is_active boolean DEFAULT true,
    acknowledged_by integer,
    acknowledged_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 345 (class 1259 OID 458828)
-- Name: ddmrp_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ddmrp_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4425 (class 0 OID 0)
-- Dependencies: 345
-- Name: ddmrp_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ddmrp_alerts_id_seq OWNED BY public.ddmrp_alerts.id;


--
-- TOC entry 340 (class 1259 OID 458777)
-- Name: ddmrp_buffer_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ddmrp_buffer_history (
    id integer NOT NULL,
    buffer_id integer NOT NULL,
    stock_level numeric NOT NULL,
    net_flow_position numeric,
    buffer_status character varying(20),
    buffer_percentage numeric,
    red_zone numeric,
    yellow_zone numeric,
    green_zone numeric,
    demand_spike boolean DEFAULT false,
    supply_delay boolean DEFAULT false,
    stockout boolean DEFAULT false,
    recorded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 339 (class 1259 OID 458776)
-- Name: ddmrp_buffer_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ddmrp_buffer_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4426 (class 0 OID 0)
-- Dependencies: 339
-- Name: ddmrp_buffer_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ddmrp_buffer_history_id_seq OWNED BY public.ddmrp_buffer_history.id;


--
-- TOC entry 338 (class 1259 OID 458753)
-- Name: ddmrp_buffers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ddmrp_buffers (
    id integer NOT NULL,
    item_id integer NOT NULL,
    buffer_type character varying(50) NOT NULL,
    decoupling_point boolean DEFAULT false,
    lead_time integer NOT NULL,
    lead_time_variability numeric DEFAULT 0.2,
    average_daily_usage numeric NOT NULL,
    demand_variability character varying(20) DEFAULT 'medium'::character varying,
    red_zone_base numeric,
    red_zone_safety numeric,
    yellow_zone numeric,
    green_zone numeric,
    current_stock numeric DEFAULT 0,
    net_flow_position numeric,
    buffer_status character varying(20),
    buffer_percentage numeric,
    minimum_order_quantity numeric,
    order_multiple numeric,
    demand_adjustment_factor numeric DEFAULT 1.0,
    lead_time_adjustment_factor numeric DEFAULT 1.0,
    variability_adjustment_factor numeric DEFAULT 1.0,
    last_calculated timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 337 (class 1259 OID 458752)
-- Name: ddmrp_buffers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ddmrp_buffers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4427 (class 0 OID 0)
-- Dependencies: 337
-- Name: ddmrp_buffers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ddmrp_buffers_id_seq OWNED BY public.ddmrp_buffers.id;


--
-- TOC entry 342 (class 1259 OID 458795)
-- Name: ddmrp_demand_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ddmrp_demand_history (
    id integer NOT NULL,
    item_id integer NOT NULL,
    demand_date date NOT NULL,
    actual_demand numeric NOT NULL,
    qualified_demand numeric,
    demand_source character varying(100),
    demand_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 341 (class 1259 OID 458794)
-- Name: ddmrp_demand_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ddmrp_demand_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4428 (class 0 OID 0)
-- Dependencies: 341
-- Name: ddmrp_demand_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ddmrp_demand_history_id_seq OWNED BY public.ddmrp_demand_history.id;


--
-- TOC entry 344 (class 1259 OID 458810)
-- Name: ddmrp_supply_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ddmrp_supply_orders (
    id integer NOT NULL,
    buffer_id integer NOT NULL,
    order_number character varying(100),
    order_type character varying(50),
    order_quantity numeric NOT NULL,
    order_date timestamp without time zone NOT NULL,
    due_date timestamp without time zone,
    received_date timestamp without time zone,
    status character varying(50) DEFAULT 'open'::character varying,
    buffer_status_at_order character varying(20),
    net_flow_at_order numeric,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 343 (class 1259 OID 458809)
-- Name: ddmrp_supply_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ddmrp_supply_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4429 (class 0 OID 0)
-- Dependencies: 343
-- Name: ddmrp_supply_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ddmrp_supply_orders_id_seq OWNED BY public.ddmrp_supply_orders.id;


--
-- TOC entry 302 (class 1259 OID 278743)
-- Name: extension_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extension_data (
    id integer NOT NULL,
    algorithm_id integer NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    field_name character varying(100) NOT NULL,
    field_value jsonb NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 301 (class 1259 OID 278742)
-- Name: extension_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.extension_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4430 (class 0 OID 0)
-- Dependencies: 301
-- Name: extension_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.extension_data_id_seq OWNED BY public.extension_data.id;


--
-- TOC entry 306 (class 1259 OID 278787)
-- Name: governance_deployments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.governance_deployments (
    id integer NOT NULL,
    plant_approval_id integer NOT NULL,
    deployment_name character varying(200) NOT NULL,
    deployment_type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    deployed_at timestamp without time zone,
    last_run_at timestamp without time zone,
    health_status character varying(20) DEFAULT 'unknown'::character varying,
    run_statistics jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 305 (class 1259 OID 278786)
-- Name: governance_deployments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.governance_deployments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4431 (class 0 OID 0)
-- Dependencies: 305
-- Name: governance_deployments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.governance_deployments_id_seq OWNED BY public.governance_deployments.id;


--
-- TOC entry 318 (class 1259 OID 352257)
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id integer NOT NULL,
    item_number character varying(100) NOT NULL,
    item_name character varying(255) NOT NULL,
    description text,
    item_type character varying(50) DEFAULT 'finished_good'::character varying,
    unit_of_measure character varying(20),
    standard_cost numeric,
    status character varying(50) DEFAULT 'active'::character varying,
    plant_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 317 (class 1259 OID 352256)
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4432 (class 0 OID 0)
-- Dependencies: 317
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- TOC entry 348 (class 1259 OID 466952)
-- Name: llm_provider_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_provider_config (
    id integer NOT NULL,
    provider_type public.llm_provider_type NOT NULL,
    provider_name character varying(100) NOT NULL,
    is_active boolean DEFAULT false,
    is_default boolean DEFAULT false,
    configuration jsonb NOT NULL,
    default_model character varying(100),
    available_models jsonb DEFAULT '[]'::jsonb,
    temperature numeric(3,2) DEFAULT 0.7,
    max_tokens integer DEFAULT 4000,
    timeout_seconds integer DEFAULT 30,
    data_retention character varying(50) DEFAULT 'none'::character varying,
    allow_data_sharing boolean DEFAULT false,
    last_used_at timestamp without time zone,
    total_requests integer DEFAULT 0,
    total_tokens integer DEFAULT 0,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 347 (class 1259 OID 466951)
-- Name: llm_provider_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.llm_provider_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4433 (class 0 OID 0)
-- Dependencies: 347
-- Name: llm_provider_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.llm_provider_config_id_seq OWNED BY public.llm_provider_config.id;


--
-- TOC entry 350 (class 1259 OID 466983)
-- Name: llm_usage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_usage_logs (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    feature character varying(100) NOT NULL,
    user_id integer,
    model character varying(100),
    prompt_tokens integer,
    completion_tokens integer,
    total_tokens integer,
    response_time_ms integer,
    status character varying(20) NOT NULL,
    error_message text,
    prompt_summary text,
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- TOC entry 349 (class 1259 OID 466982)
-- Name: llm_usage_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.llm_usage_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4434 (class 0 OID 0)
-- Dependencies: 349
-- Name: llm_usage_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.llm_usage_logs_id_seq OWNED BY public.llm_usage_logs.id;


--
-- TOC entry 282 (class 1259 OID 270391)
-- Name: maintenance_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_periods (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    is_recurring boolean DEFAULT false NOT NULL,
    recurrence_pattern public.recurrence_pattern DEFAULT 'none'::public.recurrence_pattern,
    recurrence_interval integer DEFAULT 1,
    recurrence_end_date timestamp without time zone,
    recurrence_days_of_week jsonb,
    recurrence_day_of_month integer,
    resource_id integer,
    job_id integer,
    plant_id integer,
    calendar_id integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by integer
);


--
-- TOC entry 281 (class 1259 OID 270390)
-- Name: maintenance_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenance_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4435 (class 0 OID 0)
-- Dependencies: 281
-- Name: maintenance_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenance_periods_id_seq OWNED BY public.maintenance_periods.id;


--
-- TOC entry 270 (class 1259 OID 122881)
-- Name: max_chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.max_chat_messages (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    agent_id character varying(100),
    agent_name character varying(255),
    source character varying(20),
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 269 (class 1259 OID 122880)
-- Name: max_chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.max_chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4436 (class 0 OID 0)
-- Dependencies: 269
-- Name: max_chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.max_chat_messages_id_seq OWNED BY public.max_chat_messages.id;


--
-- TOC entry 256 (class 1259 OID 90139)
-- Name: oauth_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_clients (
    id integer NOT NULL,
    client_id character varying(255) NOT NULL,
    client_secret character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    redirect_uris text[],
    scopes text[],
    created_by integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 255 (class 1259 OID 90138)
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
-- TOC entry 4437 (class 0 OID 0)
-- Dependencies: 255
-- Name: oauth_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.oauth_clients_id_seq OWNED BY public.oauth_clients.id;


--
-- TOC entry 258 (class 1259 OID 90153)
-- Name: oauth_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_tokens (
    id integer NOT NULL,
    client_id integer NOT NULL,
    access_token character varying(255) NOT NULL,
    refresh_token character varying(255),
    expires_at timestamp without time zone NOT NULL,
    scopes text[],
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 257 (class 1259 OID 90152)
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
-- TOC entry 4438 (class 0 OID 0)
-- Dependencies: 257
-- Name: oauth_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.oauth_tokens_id_seq OWNED BY public.oauth_tokens.id;


--
-- TOC entry 361 (class 1259 OID 491598)
-- Name: onboarding_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_documents (
    id integer NOT NULL,
    user_id integer,
    document_name character varying(255) NOT NULL,
    document_type character varying(100) NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type character varying(100),
    category character varying(50) NOT NULL,
    description text,
    tags text[],
    ai_analysis_status character varying(20) DEFAULT 'pending'::character varying,
    ai_analysis_summary text,
    ai_extracted_insights jsonb,
    upload_date timestamp without time zone DEFAULT now(),
    last_analyzed_at timestamp without time zone,
    is_archived boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 360 (class 1259 OID 491597)
-- Name: onboarding_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.onboarding_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4439 (class 0 OID 0)
-- Dependencies: 360
-- Name: onboarding_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.onboarding_documents_id_seq OWNED BY public.onboarding_documents.id;


--
-- TOC entry 310 (class 1259 OID 294935)
-- Name: operation_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operation_versions (
    id integer NOT NULL,
    operation_id integer NOT NULL,
    version_id integer NOT NULL,
    scheduled_start timestamp without time zone,
    scheduled_end timestamp without time zone,
    resource_id integer,
    sequence_number integer,
    change_type character varying(50),
    changed_fields jsonb,
    previous_values jsonb,
    new_values jsonb,
    manually_scheduled boolean DEFAULT false,
    lock_reason text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 309 (class 1259 OID 294934)
-- Name: operation_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.operation_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4440 (class 0 OID 0)
-- Dependencies: 309
-- Name: operation_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.operation_versions_id_seq OWNED BY public.operation_versions.id;


--
-- TOC entry 284 (class 1259 OID 278529)
-- Name: optimization_algorithms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optimization_algorithms (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(200) NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    type character varying(50) NOT NULL,
    base_algorithm_id integer,
    version character varying(20) DEFAULT '1.0'::character varying,
    status character varying(20) DEFAULT 'draft'::character varying,
    is_standard boolean DEFAULT false,
    configuration jsonb DEFAULT '{}'::jsonb,
    algorithm_code text,
    ui_components jsonb DEFAULT '{}'::jsonb,
    performance jsonb DEFAULT '{}'::jsonb,
    approvals jsonb DEFAULT '{}'::jsonb,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 283 (class 1259 OID 278528)
-- Name: optimization_algorithms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.optimization_algorithms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4441 (class 0 OID 0)
-- Dependencies: 283
-- Name: optimization_algorithms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.optimization_algorithms_id_seq OWNED BY public.optimization_algorithms.id;


--
-- TOC entry 296 (class 1259 OID 278667)
-- Name: optimization_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optimization_profiles (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    algorithm_id integer,
    scope jsonb DEFAULT '{}'::jsonb,
    objectives jsonb DEFAULT '{}'::jsonb,
    runtime_options jsonb DEFAULT '{}'::jsonb,
    constraints jsonb DEFAULT '{}'::jsonb,
    validation_rules jsonb DEFAULT '{}'::jsonb,
    output_settings jsonb DEFAULT '{}'::jsonb,
    is_default boolean DEFAULT false,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 295 (class 1259 OID 278666)
-- Name: optimization_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.optimization_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4442 (class 0 OID 0)
-- Dependencies: 295
-- Name: optimization_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.optimization_profiles_id_seq OWNED BY public.optimization_profiles.id;


--
-- TOC entry 298 (class 1259 OID 278695)
-- Name: optimization_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optimization_runs (
    id integer NOT NULL,
    algorithm_id integer NOT NULL,
    profile_id integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    execution_time_ms integer,
    input_data jsonb DEFAULT '{}'::jsonb,
    output_data jsonb DEFAULT '{}'::jsonb,
    metrics jsonb DEFAULT '{}'::jsonb,
    errors jsonb DEFAULT '[]'::jsonb,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 297 (class 1259 OID 278694)
-- Name: optimization_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.optimization_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4443 (class 0 OID 0)
-- Dependencies: 297
-- Name: optimization_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.optimization_runs_id_seq OWNED BY public.optimization_runs.id;


--
-- TOC entry 300 (class 1259 OID 278725)
-- Name: optimization_scope_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optimization_scope_configs (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    configuration jsonb DEFAULT '{}'::jsonb,
    is_default boolean DEFAULT false,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 299 (class 1259 OID 278724)
-- Name: optimization_scope_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.optimization_scope_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4444 (class 0 OID 0)
-- Dependencies: 299
-- Name: optimization_scope_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.optimization_scope_configs_id_seq OWNED BY public.optimization_scope_configs.id;


--
-- TOC entry 241 (class 1259 OID 81935)
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
-- TOC entry 240 (class 1259 OID 81934)
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
-- TOC entry 4445 (class 0 OID 0)
-- Dependencies: 240
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- TOC entry 365 (class 1259 OID 663553)
-- Name: planning_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planning_areas (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    optimization_method character varying DEFAULT 'optimization_studio'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 364 (class 1259 OID 663552)
-- Name: planning_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planning_areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4446 (class 0 OID 0)
-- Dependencies: 364
-- Name: planning_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planning_areas_id_seq OWNED BY public.planning_areas.id;


--
-- TOC entry 324 (class 1259 OID 368662)
-- Name: plant_kpi_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plant_kpi_performance (
    id integer NOT NULL,
    plant_kpi_target_id integer NOT NULL,
    measurement_date timestamp without time zone NOT NULL,
    actual_value numeric NOT NULL,
    target_value numeric NOT NULL,
    performance_ratio numeric NOT NULL,
    performance_grade character varying(20),
    trend_direction character varying(10),
    percentage_change numeric,
    notes text,
    data_source character varying(100),
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 323 (class 1259 OID 368661)
-- Name: plant_kpi_performance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plant_kpi_performance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4447 (class 0 OID 0)
-- Dependencies: 323
-- Name: plant_kpi_performance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plant_kpi_performance_id_seq OWNED BY public.plant_kpi_performance.id;


--
-- TOC entry 322 (class 1259 OID 368641)
-- Name: plant_kpi_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plant_kpi_targets (
    id integer NOT NULL,
    plant_id integer NOT NULL,
    kpi_name character varying(200) NOT NULL,
    kpi_type character varying(50) NOT NULL,
    target_value numeric NOT NULL,
    unit_of_measure character varying(50) NOT NULL,
    weight numeric DEFAULT 1,
    is_active boolean DEFAULT true,
    description text,
    excellent_threshold numeric DEFAULT 1.0,
    good_threshold numeric DEFAULT 0.95,
    warning_threshold numeric DEFAULT 0.85,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 321 (class 1259 OID 368640)
-- Name: plant_kpi_targets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plant_kpi_targets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4448 (class 0 OID 0)
-- Dependencies: 321
-- Name: plant_kpi_targets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plant_kpi_targets_id_seq OWNED BY public.plant_kpi_targets.id;


--
-- TOC entry 354 (class 1259 OID 483347)
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
-- TOC entry 353 (class 1259 OID 483346)
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
-- TOC entry 4449 (class 0 OID 0)
-- Dependencies: 353
-- Name: playbook_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.playbook_usage_id_seq OWNED BY public.playbook_usage.id;


--
-- TOC entry 352 (class 1259 OID 483329)
-- Name: playbooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playbooks (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    content text NOT NULL,
    agent_id character varying(50),
    category character varying(100),
    tags jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 351 (class 1259 OID 483328)
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
-- TOC entry 4450 (class 0 OID 0)
-- Dependencies: 351
-- Name: playbooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.playbooks_id_seq OWNED BY public.playbooks.id;


--
-- TOC entry 278 (class 1259 OID 155710)
-- Name: pt_product_wheel_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pt_product_wheel_performance (
    id integer NOT NULL,
    wheel_id integer NOT NULL,
    cycle_number integer NOT NULL,
    oee_percentage numeric(5,2),
    changeover_efficiency numeric(5,2),
    inventory_turns numeric(10,2),
    service_level numeric(5,2),
    total_changeover_time numeric(10,2),
    total_production_time numeric(10,2),
    waste_percentage numeric(5,2),
    recorded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 277 (class 1259 OID 155709)
-- Name: pt_product_wheel_performance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pt_product_wheel_performance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4451 (class 0 OID 0)
-- Dependencies: 277
-- Name: pt_product_wheel_performance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pt_product_wheel_performance_id_seq OWNED BY public.pt_product_wheel_performance.id;


--
-- TOC entry 276 (class 1259 OID 155693)
-- Name: pt_product_wheel_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pt_product_wheel_schedule (
    id integer NOT NULL,
    wheel_id integer NOT NULL,
    cycle_number integer NOT NULL,
    scheduled_start timestamp without time zone NOT NULL,
    scheduled_end timestamp without time zone NOT NULL,
    actual_start timestamp without time zone,
    actual_end timestamp without time zone,
    status character varying(50) DEFAULT 'planned'::character varying,
    adherence_percentage numeric(5,2),
    notes text,
    created_by character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 275 (class 1259 OID 155692)
-- Name: pt_product_wheel_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pt_product_wheel_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4452 (class 0 OID 0)
-- Dependencies: 275
-- Name: pt_product_wheel_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pt_product_wheel_schedule_id_seq OWNED BY public.pt_product_wheel_schedule.id;


--
-- TOC entry 274 (class 1259 OID 155672)
-- Name: pt_product_wheel_segments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pt_product_wheel_segments (
    id integer NOT NULL,
    wheel_id integer NOT NULL,
    sequence_number integer NOT NULL,
    product_id integer,
    product_code character varying(100) NOT NULL,
    product_name character varying(255) NOT NULL,
    allocated_hours numeric(10,2) NOT NULL,
    min_batch_size numeric(15,3),
    max_batch_size numeric(15,3),
    preferred_batch_size numeric(15,3),
    changeover_time_hours numeric(10,2),
    cleanup_time_hours numeric(10,2),
    color_code character varying(7),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 273 (class 1259 OID 155671)
-- Name: pt_product_wheel_segments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pt_product_wheel_segments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4453 (class 0 OID 0)
-- Dependencies: 273
-- Name: pt_product_wheel_segments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pt_product_wheel_segments_id_seq OWNED BY public.pt_product_wheel_segments.id;


--
-- TOC entry 272 (class 1259 OID 155649)
-- Name: pt_product_wheels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pt_product_wheels (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    resource_id integer,
    plant_id integer,
    cycle_duration_hours numeric(10,2) NOT NULL,
    changeover_matrix jsonb,
    optimization_rules jsonb,
    is_active boolean DEFAULT true,
    status character varying(50) DEFAULT 'draft'::character varying,
    created_by character varying(100),
    last_modified_by character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 271 (class 1259 OID 155648)
-- Name: pt_product_wheels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pt_product_wheels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4454 (class 0 OID 0)
-- Dependencies: 271
-- Name: pt_product_wheels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pt_product_wheels_id_seq OWNED BY public.pt_product_wheels.id;


--
-- TOC entry 222 (class 1259 OID 24622)
-- Name: ptjobactivities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ptjobactivities (
    id integer NOT NULL,
    operation_id integer,
    external_id character varying(255),
    production_status character varying(100),
    comments text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 221 (class 1259 OID 24621)
-- Name: ptjobactivities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ptjobactivities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4455 (class 0 OID 0)
-- Dependencies: 221
-- Name: ptjobactivities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ptjobactivities_id_seq OWNED BY public.ptjobactivities.id;


--
-- TOC entry 220 (class 1259 OID 24605)
-- Name: ptjoboperations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ptjoboperations (
    id integer NOT NULL,
    job_id integer,
    external_id character varying(255),
    name character varying(255) NOT NULL,
    description text,
    operation_id character varying(255),
    base_operation_id character varying(255),
    required_finish_qty numeric(10,2),
    cycle_hrs numeric(10,2),
    setup_hours numeric(10,2),
    post_processing_hours numeric(10,2),
    scheduled_start timestamp without time zone,
    scheduled_end timestamp without time zone,
    percent_finished numeric(5,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    manually_scheduled boolean DEFAULT false,
    constraint_type character varying(10),
    constraint_date timestamp without time zone,
    time_optimistic numeric(10,4),
    time_most_likely numeric(10,4),
    time_pessimistic numeric(10,4),
    time_expected numeric(10,4),
    time_variance numeric(10,6),
    time_std_dev numeric(10,4),
    sequence_number integer
);


--
-- TOC entry 219 (class 1259 OID 24604)
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
-- TOC entry 4456 (class 0 OID 0)
-- Dependencies: 219
-- Name: ptjoboperations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ptjoboperations_id_seq OWNED BY public.ptjoboperations.id;


--
-- TOC entry 224 (class 1259 OID 24638)
-- Name: ptjobresources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ptjobresources (
    id integer NOT NULL,
    operation_id integer,
    default_resource_id character varying(255),
    is_primary boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 223 (class 1259 OID 24637)
-- Name: ptjobresources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ptjobresources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4457 (class 0 OID 0)
-- Dependencies: 223
-- Name: ptjobresources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ptjobresources_id_seq OWNED BY public.ptjobresources.id;


--
-- TOC entry 218 (class 1259 OID 24593)
-- Name: ptjobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ptjobs (
    id integer NOT NULL,
    external_id character varying(255),
    name character varying(255) NOT NULL,
    description text,
    priority integer DEFAULT 1,
    need_date_time timestamp without time zone,
    scheduled_status character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    manufacturing_release_date timestamp without time zone
);


--
-- TOC entry 217 (class 1259 OID 24592)
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
-- TOC entry 4458 (class 0 OID 0)
-- Dependencies: 217
-- Name: ptjobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ptjobs_id_seq OWNED BY public.ptjobs.id;


--
-- TOC entry 226 (class 1259 OID 24653)
-- Name: ptplants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ptplants (
    id integer NOT NULL,
    external_id character varying(255),
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    publish_date timestamp without time zone,
    instance_id character varying(38),
    plant_id integer,
    notes text,
    bottleneck_threshold numeric,
    heavy_load_threshold numeric,
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
-- TOC entry 225 (class 1259 OID 24652)
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
-- TOC entry 4459 (class 0 OID 0)
-- Dependencies: 225
-- Name: ptplants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ptplants_id_seq OWNED BY public.ptplants.id;


--
-- TOC entry 235 (class 1259 OID 65536)
-- Name: ptresourcecapabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ptresourcecapabilities (
    id integer NOT NULL,
    publish_date timestamp without time zone NOT NULL,
    instance_id character varying(38) NOT NULL,
    resource_id bigint NOT NULL,
    capability_id bigint NOT NULL,
    throughput_modifier numeric,
    setup_hours_override numeric,
    use_throughput_modifier boolean,
    use_setup_hours_override boolean
);


--
-- TOC entry 216 (class 1259 OID 24577)
-- Name: ptresources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ptresources (
    id integer NOT NULL,
    resource_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    external_id character varying(255),
    plant_id integer,
    plant_name character varying(255),
    department_id integer,
    department_name character varying(255),
    active boolean DEFAULT true,
    bottleneck boolean DEFAULT false,
    buffer_hours numeric(10,2),
    capacity_type character varying(100),
    hourly_cost numeric(10,2),
    setup_cost numeric(10,2),
    tank boolean DEFAULT false,
    publish_date timestamp without time zone,
    instance_id character varying(100),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    planning_area character varying(100)
);


--
-- TOC entry 215 (class 1259 OID 24576)
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
-- TOC entry 4460 (class 0 OID 0)
-- Dependencies: 215
-- Name: ptresources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ptresources_id_seq OWNED BY public.ptresources.id;


--
-- TOC entry 234 (class 1259 OID 57388)
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
-- TOC entry 233 (class 1259 OID 57387)
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
-- TOC entry 4461 (class 0 OID 0)
-- Dependencies: 233
-- Name: recent_pages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recent_pages_id_seq OWNED BY public.recent_pages.id;


--
-- TOC entry 244 (class 1259 OID 81968)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    granted_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 243 (class 1259 OID 81967)
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
-- TOC entry 4462 (class 0 OID 0)
-- Dependencies: 243
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- TOC entry 239 (class 1259 OID 81921)
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
-- TOC entry 238 (class 1259 OID 81920)
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
-- TOC entry 4463 (class 0 OID 0)
-- Dependencies: 238
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 328 (class 1259 OID 434177)
-- Name: saved_forecasts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_forecasts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    model_type character varying(50),
    forecast_days integer,
    item_column character varying(100),
    quantity_column character varying(100),
    date_column character varying(100),
    forecast_start_date timestamp without time zone,
    forecast_end_date timestamp without time zone,
    forecasted_items jsonb DEFAULT '[]'::jsonb,
    planning_areas jsonb DEFAULT '[]'::jsonb,
    scenarios jsonb DEFAULT '[]'::jsonb,
    forecast_data jsonb DEFAULT '{}'::jsonb,
    item_forecasts jsonb DEFAULT '{}'::jsonb,
    metrics jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 327 (class 1259 OID 434176)
-- Name: saved_forecasts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.saved_forecasts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4464 (class 0 OID 0)
-- Dependencies: 327
-- Name: saved_forecasts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.saved_forecasts_id_seq OWNED BY public.saved_forecasts.id;


--
-- TOC entry 237 (class 1259 OID 73729)
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
-- TOC entry 236 (class 1259 OID 73728)
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
-- TOC entry 4465 (class 0 OID 0)
-- Dependencies: 236
-- Name: saved_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.saved_schedules_id_seq OWNED BY public.saved_schedules.id;


--
-- TOC entry 314 (class 1259 OID 294984)
-- Name: schedule_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_locks (
    id integer NOT NULL,
    schedule_id integer NOT NULL,
    version_id integer NOT NULL,
    lock_type character varying(20) NOT NULL,
    locked_by integer NOT NULL,
    locked_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    session_id character varying(100),
    purpose text,
    expected_version integer NOT NULL,
    actual_version integer,
    is_active boolean DEFAULT true
);


--
-- TOC entry 313 (class 1259 OID 294983)
-- Name: schedule_locks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_locks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4466 (class 0 OID 0)
-- Dependencies: 313
-- Name: schedule_locks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_locks_id_seq OWNED BY public.schedule_locks.id;


--
-- TOC entry 308 (class 1259 OID 294913)
-- Name: schedule_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_versions (
    id integer NOT NULL,
    schedule_id integer NOT NULL,
    version_number integer NOT NULL,
    version_tag character varying(50),
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    source character varying(50) NOT NULL,
    comment text,
    snapshot_data jsonb NOT NULL,
    operation_snapshots jsonb NOT NULL,
    resource_allocations jsonb,
    parent_version_id integer,
    branch_name character varying(100) DEFAULT 'main'::character varying,
    is_merged boolean DEFAULT false,
    merged_into_version_id integer,
    checksum character varying(64) NOT NULL,
    conflict_resolution jsonb,
    metrics jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    is_baseline boolean DEFAULT false
);


--
-- TOC entry 307 (class 1259 OID 294912)
-- Name: schedule_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4467 (class 0 OID 0)
-- Dependencies: 307
-- Name: schedule_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_versions_id_seq OWNED BY public.schedule_versions.id;


--
-- TOC entry 363 (class 1259 OID 507905)
-- Name: tours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tours (
    id integer NOT NULL,
    role_id integer NOT NULL,
    role_name character varying(100) NOT NULL,
    role_display_name character varying(100),
    tour_data jsonb NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying,
    version integer DEFAULT 1,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 362 (class 1259 OID 507904)
-- Name: tours_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tours_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4468 (class 0 OID 0)
-- Dependencies: 362
-- Name: tours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tours_id_seq OWNED BY public.tours.id;


--
-- TOC entry 230 (class 1259 OID 57345)
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
-- TOC entry 229 (class 1259 OID 57344)
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
-- TOC entry 4469 (class 0 OID 0)
-- Dependencies: 229
-- Name: user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_preferences_id_seq OWNED BY public.user_preferences.id;


--
-- TOC entry 242 (class 1259 OID 81946)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now(),
    assigned_by integer
);


--
-- TOC entry 228 (class 1259 OID 49153)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    password_hash text NOT NULL,
    is_active boolean DEFAULT true,
    active_role_id integer,
    last_login timestamp without time zone,
    avatar text,
    job_title character varying(255),
    department character varying(255),
    phone_number character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 227 (class 1259 OID 49152)
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
-- TOC entry 4470 (class 0 OID 0)
-- Dependencies: 227
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 312 (class 1259 OID 294958)
-- Name: version_comparisons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.version_comparisons (
    id integer NOT NULL,
    version_id_1 integer NOT NULL,
    version_id_2 integer NOT NULL,
    comparison_type character varying(50),
    differences jsonb NOT NULL,
    conflict_count integer DEFAULT 0,
    metrics_delta jsonb,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 311 (class 1259 OID 294957)
-- Name: version_comparisons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.version_comparisons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4471 (class 0 OID 0)
-- Dependencies: 311
-- Name: version_comparisons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.version_comparisons_id_seq OWNED BY public.version_comparisons.id;


--
-- TOC entry 316 (class 1259 OID 295005)
-- Name: version_rollbacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.version_rollbacks (
    id integer NOT NULL,
    schedule_id integer NOT NULL,
    from_version_id integer NOT NULL,
    to_version_id integer NOT NULL,
    rollback_reason text NOT NULL,
    rollback_type character varying(50),
    affected_operations jsonb,
    performed_by integer NOT NULL,
    performed_at timestamp without time zone DEFAULT now() NOT NULL,
    approved boolean DEFAULT false,
    approved_by integer,
    approved_at timestamp without time zone
);


--
-- TOC entry 315 (class 1259 OID 295004)
-- Name: version_rollbacks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.version_rollbacks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4472 (class 0 OID 0)
-- Dependencies: 315
-- Name: version_rollbacks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.version_rollbacks_id_seq OWNED BY public.version_rollbacks.id;


--
-- TOC entry 248 (class 1259 OID 82012)
-- Name: widget_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.widget_types (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    icon character varying(50),
    configurable boolean DEFAULT true,
    data_source_required boolean DEFAULT false,
    default_size jsonb DEFAULT '{"h": 2, "w": 4}'::jsonb,
    config_schema jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 247 (class 1259 OID 82011)
-- Name: widget_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.widget_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4473 (class 0 OID 0)
-- Dependencies: 247
-- Name: widget_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.widget_types_id_seq OWNED BY public.widget_types.id;


--
-- TOC entry 250 (class 1259 OID 82027)
-- Name: widgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.widgets (
    id integer NOT NULL,
    dashboard_id integer,
    widget_type_id integer,
    type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    "position" jsonb DEFAULT '{"h": 2, "w": 4, "x": 0, "y": 0}'::jsonb NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 249 (class 1259 OID 82026)
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
-- TOC entry 4474 (class 0 OID 0)
-- Dependencies: 249
-- Name: widgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.widgets_id_seq OWNED BY public.widgets.id;


--
-- TOC entry 3676 (class 2604 OID 106550)
-- Name: agent_actions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_actions ALTER COLUMN id SET DEFAULT nextval('public.agent_actions_id_seq'::regclass);


--
-- TOC entry 3686 (class 2604 OID 106607)
-- Name: agent_alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_alerts ALTER COLUMN id SET DEFAULT nextval('public.agent_alerts_id_seq'::regclass);


--
-- TOC entry 3667 (class 2604 OID 106521)
-- Name: agent_connections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_connections ALTER COLUMN id SET DEFAULT nextval('public.agent_connections_id_seq'::regclass);


--
-- TOC entry 3678 (class 2604 OID 106565)
-- Name: agent_metrics_hourly id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_metrics_hourly ALTER COLUMN id SET DEFAULT nextval('public.agent_metrics_hourly_id_seq'::regclass);


--
-- TOC entry 3683 (class 2604 OID 106581)
-- Name: agent_policies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_policies ALTER COLUMN id SET DEFAULT nextval('public.agent_policies_id_seq'::regclass);


--
-- TOC entry 3925 (class 2604 OID 491554)
-- Name: agent_recommendations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommendations ALTER COLUMN id SET DEFAULT nextval('public.agent_recommendations_id_seq'::regclass);


--
-- TOC entry 3917 (class 2604 OID 491538)
-- Name: ai_agent_team id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent_team ALTER COLUMN id SET DEFAULT nextval('public.ai_agent_team_id_seq'::regclass);


--
-- TOC entry 3742 (class 2604 OID 278582)
-- Name: algorithm_deployments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_deployments ALTER COLUMN id SET DEFAULT nextval('public.algorithm_deployments_id_seq'::regclass);


--
-- TOC entry 3747 (class 2604 OID 278605)
-- Name: algorithm_feedback id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback ALTER COLUMN id SET DEFAULT nextval('public.algorithm_feedback_id_seq'::regclass);


--
-- TOC entry 3755 (class 2604 OID 278632)
-- Name: algorithm_feedback_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback_comments ALTER COLUMN id SET DEFAULT nextval('public.algorithm_feedback_comments_id_seq'::regclass);


--
-- TOC entry 3757 (class 2604 OID 278652)
-- Name: algorithm_feedback_votes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback_votes ALTER COLUMN id SET DEFAULT nextval('public.algorithm_feedback_votes_id_seq'::regclass);


--
-- TOC entry 3784 (class 2604 OID 278767)
-- Name: algorithm_governance_approvals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_governance_approvals ALTER COLUMN id SET DEFAULT nextval('public.algorithm_governance_approvals_id_seq'::regclass);


--
-- TOC entry 3738 (class 2604 OID 278560)
-- Name: algorithm_tests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_tests ALTER COLUMN id SET DEFAULT nextval('public.algorithm_tests_id_seq'::regclass);


--
-- TOC entry 3659 (class 2604 OID 90132)
-- Name: api_key_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_key_usage ALTER COLUMN id SET DEFAULT nextval('public.api_key_usage_id_seq'::regclass);


--
-- TOC entry 3655 (class 2604 OID 90116)
-- Name: api_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys ALTER COLUMN id SET DEFAULT nextval('public.api_keys_id_seq'::regclass);


--
-- TOC entry 3868 (class 2604 OID 442410)
-- Name: atpcapacitysnapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atpcapacitysnapshots ALTER COLUMN id SET DEFAULT nextval('public.atpcapacitysnapshots_id_seq'::regclass);


--
-- TOC entry 3856 (class 2604 OID 442372)
-- Name: atpmaterialreservations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atpmaterialreservations ALTER COLUMN id SET DEFAULT nextval('public.atpmaterialreservations_id_seq'::regclass);


--
-- TOC entry 3866 (class 2604 OID 442400)
-- Name: atpreservationhistory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atpreservationhistory ALTER COLUMN id SET DEFAULT nextval('public.atpreservationhistory_id_seq'::regclass);


--
-- TOC entry 3861 (class 2604 OID 442387)
-- Name: atpresourcereservations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atpresourcereservations ALTER COLUMN id SET DEFAULT nextval('public.atpresourcereservations_id_seq'::regclass);


--
-- TOC entry 3833 (class 2604 OID 368685)
-- Name: autonomous_optimization id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autonomous_optimization ALTER COLUMN id SET DEFAULT nextval('public.autonomous_optimization_id_seq'::regclass);


--
-- TOC entry 3706 (class 2604 OID 270351)
-- Name: calendars id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendars ALTER COLUMN id SET DEFAULT nextval('public.calendars_id_seq'::regclass);


--
-- TOC entry 3818 (class 2604 OID 352275)
-- Name: capabilities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capabilities ALTER COLUMN id SET DEFAULT nextval('public.capabilities_id_seq'::regclass);


--
-- TOC entry 3612 (class 2604 OID 57370)
-- Name: company_onboarding id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_onboarding ALTER COLUMN id SET DEFAULT nextval('public.company_onboarding_id_seq'::regclass);


--
-- TOC entry 3636 (class 2604 OID 81991)
-- Name: dashboards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboards ALTER COLUMN id SET DEFAULT nextval('public.dashboards_id_seq'::regclass);


--
-- TOC entry 3892 (class 2604 OID 458832)
-- Name: ddmrp_alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_alerts ALTER COLUMN id SET DEFAULT nextval('public.ddmrp_alerts_id_seq'::regclass);


--
-- TOC entry 3881 (class 2604 OID 458780)
-- Name: ddmrp_buffer_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_buffer_history ALTER COLUMN id SET DEFAULT nextval('public.ddmrp_buffer_history_id_seq'::regclass);


--
-- TOC entry 3870 (class 2604 OID 458756)
-- Name: ddmrp_buffers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_buffers ALTER COLUMN id SET DEFAULT nextval('public.ddmrp_buffers_id_seq'::regclass);


--
-- TOC entry 3886 (class 2604 OID 458798)
-- Name: ddmrp_demand_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_demand_history ALTER COLUMN id SET DEFAULT nextval('public.ddmrp_demand_history_id_seq'::regclass);


--
-- TOC entry 3888 (class 2604 OID 458813)
-- Name: ddmrp_supply_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_supply_orders ALTER COLUMN id SET DEFAULT nextval('public.ddmrp_supply_orders_id_seq'::regclass);


--
-- TOC entry 3781 (class 2604 OID 278746)
-- Name: extension_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extension_data ALTER COLUMN id SET DEFAULT nextval('public.extension_data_id_seq'::regclass);


--
-- TOC entry 3789 (class 2604 OID 278790)
-- Name: governance_deployments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.governance_deployments ALTER COLUMN id SET DEFAULT nextval('public.governance_deployments_id_seq'::regclass);


--
-- TOC entry 3813 (class 2604 OID 352260)
-- Name: items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- TOC entry 3895 (class 2604 OID 466955)
-- Name: llm_provider_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_provider_config ALTER COLUMN id SET DEFAULT nextval('public.llm_provider_config_id_seq'::regclass);


--
-- TOC entry 3908 (class 2604 OID 466986)
-- Name: llm_usage_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_usage_logs ALTER COLUMN id SET DEFAULT nextval('public.llm_usage_logs_id_seq'::regclass);


--
-- TOC entry 3721 (class 2604 OID 270394)
-- Name: maintenance_periods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_periods ALTER COLUMN id SET DEFAULT nextval('public.maintenance_periods_id_seq'::regclass);


--
-- TOC entry 3689 (class 2604 OID 122884)
-- Name: max_chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.max_chat_messages ALTER COLUMN id SET DEFAULT nextval('public.max_chat_messages_id_seq'::regclass);


--
-- TOC entry 3661 (class 2604 OID 90142)
-- Name: oauth_clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_clients ALTER COLUMN id SET DEFAULT nextval('public.oauth_clients_id_seq'::regclass);


--
-- TOC entry 3665 (class 2604 OID 90156)
-- Name: oauth_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_tokens ALTER COLUMN id SET DEFAULT nextval('public.oauth_tokens_id_seq'::regclass);


--
-- TOC entry 3935 (class 2604 OID 491601)
-- Name: onboarding_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_documents ALTER COLUMN id SET DEFAULT nextval('public.onboarding_documents_id_seq'::regclass);


--
-- TOC entry 3801 (class 2604 OID 294938)
-- Name: operation_versions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_versions ALTER COLUMN id SET DEFAULT nextval('public.operation_versions_id_seq'::regclass);


--
-- TOC entry 3728 (class 2604 OID 278532)
-- Name: optimization_algorithms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_algorithms ALTER COLUMN id SET DEFAULT nextval('public.optimization_algorithms_id_seq'::regclass);


--
-- TOC entry 3759 (class 2604 OID 278670)
-- Name: optimization_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_profiles ALTER COLUMN id SET DEFAULT nextval('public.optimization_profiles_id_seq'::regclass);


--
-- TOC entry 3769 (class 2604 OID 278698)
-- Name: optimization_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_runs ALTER COLUMN id SET DEFAULT nextval('public.optimization_runs_id_seq'::regclass);


--
-- TOC entry 3776 (class 2604 OID 278728)
-- Name: optimization_scope_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_scope_configs ALTER COLUMN id SET DEFAULT nextval('public.optimization_scope_configs_id_seq'::regclass);


--
-- TOC entry 3631 (class 2604 OID 81938)
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- TOC entry 3945 (class 2604 OID 663556)
-- Name: planning_areas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_areas ALTER COLUMN id SET DEFAULT nextval('public.planning_areas_id_seq'::regclass);


--
-- TOC entry 3831 (class 2604 OID 368665)
-- Name: plant_kpi_performance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plant_kpi_performance ALTER COLUMN id SET DEFAULT nextval('public.plant_kpi_performance_id_seq'::regclass);


--
-- TOC entry 3823 (class 2604 OID 368644)
-- Name: plant_kpi_targets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plant_kpi_targets ALTER COLUMN id SET DEFAULT nextval('public.plant_kpi_targets_id_seq'::regclass);


--
-- TOC entry 3915 (class 2604 OID 483350)
-- Name: playbook_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbook_usage ALTER COLUMN id SET DEFAULT nextval('public.playbook_usage_id_seq'::regclass);


--
-- TOC entry 3910 (class 2604 OID 483332)
-- Name: playbooks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbooks ALTER COLUMN id SET DEFAULT nextval('public.playbooks_id_seq'::regclass);


--
-- TOC entry 3703 (class 2604 OID 155713)
-- Name: pt_product_wheel_performance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheel_performance ALTER COLUMN id SET DEFAULT nextval('public.pt_product_wheel_performance_id_seq'::regclass);


--
-- TOC entry 3699 (class 2604 OID 155696)
-- Name: pt_product_wheel_schedule id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheel_schedule ALTER COLUMN id SET DEFAULT nextval('public.pt_product_wheel_schedule_id_seq'::regclass);


--
-- TOC entry 3696 (class 2604 OID 155675)
-- Name: pt_product_wheel_segments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheel_segments ALTER COLUMN id SET DEFAULT nextval('public.pt_product_wheel_segments_id_seq'::regclass);


--
-- TOC entry 3691 (class 2604 OID 155652)
-- Name: pt_product_wheels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheels ALTER COLUMN id SET DEFAULT nextval('public.pt_product_wheels_id_seq'::regclass);


--
-- TOC entry 3584 (class 2604 OID 24625)
-- Name: ptjobactivities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjobactivities ALTER COLUMN id SET DEFAULT nextval('public.ptjobactivities_id_seq'::regclass);


--
-- TOC entry 3579 (class 2604 OID 24608)
-- Name: ptjoboperations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjoboperations ALTER COLUMN id SET DEFAULT nextval('public.ptjoboperations_id_seq'::regclass);


--
-- TOC entry 3587 (class 2604 OID 24641)
-- Name: ptjobresources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjobresources ALTER COLUMN id SET DEFAULT nextval('public.ptjobresources_id_seq'::regclass);


--
-- TOC entry 3575 (class 2604 OID 24596)
-- Name: ptjobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjobs ALTER COLUMN id SET DEFAULT nextval('public.ptjobs_id_seq'::regclass);


--
-- TOC entry 3591 (class 2604 OID 24656)
-- Name: ptplants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptplants ALTER COLUMN id SET DEFAULT nextval('public.ptplants_id_seq'::regclass);


--
-- TOC entry 3569 (class 2604 OID 24580)
-- Name: ptresources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptresources ALTER COLUMN id SET DEFAULT nextval('public.ptresources_id_seq'::regclass);


--
-- TOC entry 3620 (class 2604 OID 57391)
-- Name: recent_pages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recent_pages ALTER COLUMN id SET DEFAULT nextval('public.recent_pages_id_seq'::regclass);


--
-- TOC entry 3634 (class 2604 OID 81971)
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- TOC entry 3627 (class 2604 OID 81924)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 3846 (class 2604 OID 434180)
-- Name: saved_forecasts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_forecasts ALTER COLUMN id SET DEFAULT nextval('public.saved_forecasts_id_seq'::regclass);


--
-- TOC entry 3622 (class 2604 OID 73732)
-- Name: saved_schedules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_schedules ALTER COLUMN id SET DEFAULT nextval('public.saved_schedules_id_seq'::regclass);


--
-- TOC entry 3807 (class 2604 OID 294987)
-- Name: schedule_locks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_locks ALTER COLUMN id SET DEFAULT nextval('public.schedule_locks_id_seq'::regclass);


--
-- TOC entry 3795 (class 2604 OID 294916)
-- Name: schedule_versions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_versions ALTER COLUMN id SET DEFAULT nextval('public.schedule_versions_id_seq'::regclass);


--
-- TOC entry 3940 (class 2604 OID 507908)
-- Name: tours id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours ALTER COLUMN id SET DEFAULT nextval('public.tours_id_seq'::regclass);


--
-- TOC entry 3603 (class 2604 OID 57348)
-- Name: user_preferences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_preferences_id_seq'::regclass);


--
-- TOC entry 3599 (class 2604 OID 49156)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3804 (class 2604 OID 294961)
-- Name: version_comparisons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_comparisons ALTER COLUMN id SET DEFAULT nextval('public.version_comparisons_id_seq'::regclass);


--
-- TOC entry 3810 (class 2604 OID 295008)
-- Name: version_rollbacks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_rollbacks ALTER COLUMN id SET DEFAULT nextval('public.version_rollbacks_id_seq'::regclass);


--
-- TOC entry 3642 (class 2604 OID 82015)
-- Name: widget_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widget_types ALTER COLUMN id SET DEFAULT nextval('public.widget_types_id_seq'::regclass);


--
-- TOC entry 3649 (class 2604 OID 82030)
-- Name: widgets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets ALTER COLUMN id SET DEFAULT nextval('public.widgets_id_seq'::regclass);


--
-- TOC entry 4023 (class 2606 OID 106555)
-- Name: agent_actions agent_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_actions
    ADD CONSTRAINT agent_actions_pkey PRIMARY KEY (id);


--
-- TOC entry 4140 (class 2606 OID 491596)
-- Name: agent_activity_tracking agent_activity_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_activity_tracking
    ADD CONSTRAINT agent_activity_tracking_pkey PRIMARY KEY (agent_name);


--
-- TOC entry 4032 (class 2606 OID 106613)
-- Name: agent_alerts agent_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_alerts
    ADD CONSTRAINT agent_alerts_pkey PRIMARY KEY (id);


--
-- TOC entry 4017 (class 2606 OID 106535)
-- Name: agent_connections agent_connections_agent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_connections
    ADD CONSTRAINT agent_connections_agent_id_key UNIQUE (agent_id);


--
-- TOC entry 4019 (class 2606 OID 106533)
-- Name: agent_connections agent_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_connections
    ADD CONSTRAINT agent_connections_pkey PRIMARY KEY (id);


--
-- TOC entry 4027 (class 2606 OID 106571)
-- Name: agent_metrics_hourly agent_metrics_hourly_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_metrics_hourly
    ADD CONSTRAINT agent_metrics_hourly_pkey PRIMARY KEY (id);


--
-- TOC entry 4030 (class 2606 OID 106587)
-- Name: agent_policies agent_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_policies
    ADD CONSTRAINT agent_policies_pkey PRIMARY KEY (id);


--
-- TOC entry 4138 (class 2606 OID 491563)
-- Name: agent_recommendations agent_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommendations
    ADD CONSTRAINT agent_recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 4136 (class 2606 OID 491549)
-- Name: ai_agent_team ai_agent_team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent_team
    ADD CONSTRAINT ai_agent_team_pkey PRIMARY KEY (id);


--
-- TOC entry 4052 (class 2606 OID 278590)
-- Name: algorithm_deployments algorithm_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_deployments
    ADD CONSTRAINT algorithm_deployments_pkey PRIMARY KEY (id);


--
-- TOC entry 4056 (class 2606 OID 278637)
-- Name: algorithm_feedback_comments algorithm_feedback_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback_comments
    ADD CONSTRAINT algorithm_feedback_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4054 (class 2606 OID 278616)
-- Name: algorithm_feedback algorithm_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback
    ADD CONSTRAINT algorithm_feedback_pkey PRIMARY KEY (id);


--
-- TOC entry 4058 (class 2606 OID 278655)
-- Name: algorithm_feedback_votes algorithm_feedback_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback_votes
    ADD CONSTRAINT algorithm_feedback_votes_pkey PRIMARY KEY (id);


--
-- TOC entry 4068 (class 2606 OID 278775)
-- Name: algorithm_governance_approvals algorithm_governance_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_governance_approvals
    ADD CONSTRAINT algorithm_governance_approvals_pkey PRIMARY KEY (id);


--
-- TOC entry 4050 (class 2606 OID 278567)
-- Name: algorithm_tests algorithm_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_tests
    ADD CONSTRAINT algorithm_tests_pkey PRIMARY KEY (id);


--
-- TOC entry 4007 (class 2606 OID 90137)
-- Name: api_key_usage api_key_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_key_usage
    ADD CONSTRAINT api_key_usage_pkey PRIMARY KEY (id);


--
-- TOC entry 4001 (class 2606 OID 90125)
-- Name: api_keys api_keys_key_hash_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_hash_unique UNIQUE (key_hash);


--
-- TOC entry 4003 (class 2606 OID 90127)
-- Name: api_keys api_keys_key_prefix_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_prefix_unique UNIQUE (key_prefix);


--
-- TOC entry 4005 (class 2606 OID 90123)
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- TOC entry 4112 (class 2606 OID 442415)
-- Name: atpcapacitysnapshots atpcapacitysnapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atpcapacitysnapshots
    ADD CONSTRAINT atpcapacitysnapshots_pkey PRIMARY KEY (id);


--
-- TOC entry 4104 (class 2606 OID 442380)
-- Name: atpmaterialreservations atpmaterialreservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atpmaterialreservations
    ADD CONSTRAINT atpmaterialreservations_pkey PRIMARY KEY (id);


--
-- TOC entry 4106 (class 2606 OID 442382)
-- Name: atpmaterialreservations atpmaterialreservations_reservation_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atpmaterialreservations
    ADD CONSTRAINT atpmaterialreservations_reservation_number_key UNIQUE (reservation_number);


--
-- TOC entry 4110 (class 2606 OID 442405)
-- Name: atpreservationhistory atpreservationhistory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atpreservationhistory
    ADD CONSTRAINT atpreservationhistory_pkey PRIMARY KEY (id);


--
-- TOC entry 4108 (class 2606 OID 442395)
-- Name: atpresourcereservations atpresourcereservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atpresourcereservations
    ADD CONSTRAINT atpresourcereservations_pkey PRIMARY KEY (id);


--
-- TOC entry 4100 (class 2606 OID 368701)
-- Name: autonomous_optimization autonomous_optimization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autonomous_optimization
    ADD CONSTRAINT autonomous_optimization_pkey PRIMARY KEY (id);


--
-- TOC entry 4044 (class 2606 OID 270369)
-- Name: calendars calendars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendars
    ADD CONSTRAINT calendars_pkey PRIMARY KEY (id);


--
-- TOC entry 4094 (class 2606 OID 352283)
-- Name: capabilities capabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capabilities
    ADD CONSTRAINT capabilities_pkey PRIMARY KEY (id);


--
-- TOC entry 3973 (class 2606 OID 57381)
-- Name: company_onboarding company_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_onboarding
    ADD CONSTRAINT company_onboarding_pkey PRIMARY KEY (id);


--
-- TOC entry 3995 (class 2606 OID 82000)
-- Name: dashboards dashboards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboards
    ADD CONSTRAINT dashboards_pkey PRIMARY KEY (id);


--
-- TOC entry 4124 (class 2606 OID 458838)
-- Name: ddmrp_alerts ddmrp_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_alerts
    ADD CONSTRAINT ddmrp_alerts_pkey PRIMARY KEY (id);


--
-- TOC entry 4116 (class 2606 OID 458788)
-- Name: ddmrp_buffer_history ddmrp_buffer_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_buffer_history
    ADD CONSTRAINT ddmrp_buffer_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4114 (class 2606 OID 458770)
-- Name: ddmrp_buffers ddmrp_buffers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_buffers
    ADD CONSTRAINT ddmrp_buffers_pkey PRIMARY KEY (id);


--
-- TOC entry 4118 (class 2606 OID 458803)
-- Name: ddmrp_demand_history ddmrp_demand_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_demand_history
    ADD CONSTRAINT ddmrp_demand_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4120 (class 2606 OID 458822)
-- Name: ddmrp_supply_orders ddmrp_supply_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_supply_orders
    ADD CONSTRAINT ddmrp_supply_orders_order_number_key UNIQUE (order_number);


--
-- TOC entry 4122 (class 2606 OID 458820)
-- Name: ddmrp_supply_orders ddmrp_supply_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_supply_orders
    ADD CONSTRAINT ddmrp_supply_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4066 (class 2606 OID 278752)
-- Name: extension_data extension_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extension_data
    ADD CONSTRAINT extension_data_pkey PRIMARY KEY (id);


--
-- TOC entry 4070 (class 2606 OID 278799)
-- Name: governance_deployments governance_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.governance_deployments
    ADD CONSTRAINT governance_deployments_pkey PRIMARY KEY (id);


--
-- TOC entry 4090 (class 2606 OID 352270)
-- Name: items items_item_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_item_number_key UNIQUE (item_number);


--
-- TOC entry 4092 (class 2606 OID 352268)
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- TOC entry 4126 (class 2606 OID 466971)
-- Name: llm_provider_config llm_provider_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_provider_config
    ADD CONSTRAINT llm_provider_config_pkey PRIMARY KEY (id);


--
-- TOC entry 4128 (class 2606 OID 466991)
-- Name: llm_usage_logs llm_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_usage_logs
    ADD CONSTRAINT llm_usage_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4046 (class 2606 OID 270404)
-- Name: maintenance_periods maintenance_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_periods
    ADD CONSTRAINT maintenance_periods_pkey PRIMARY KEY (id);


--
-- TOC entry 4034 (class 2606 OID 122889)
-- Name: max_chat_messages max_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.max_chat_messages
    ADD CONSTRAINT max_chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4009 (class 2606 OID 90151)
-- Name: oauth_clients oauth_clients_client_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_clients
    ADD CONSTRAINT oauth_clients_client_id_unique UNIQUE (client_id);


--
-- TOC entry 4011 (class 2606 OID 90149)
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- TOC entry 4013 (class 2606 OID 90163)
-- Name: oauth_tokens oauth_tokens_access_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_tokens
    ADD CONSTRAINT oauth_tokens_access_token_unique UNIQUE (access_token);


--
-- TOC entry 4015 (class 2606 OID 90161)
-- Name: oauth_tokens oauth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_tokens
    ADD CONSTRAINT oauth_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4145 (class 2606 OID 491609)
-- Name: onboarding_documents onboarding_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_documents
    ADD CONSTRAINT onboarding_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4079 (class 2606 OID 294944)
-- Name: operation_versions operation_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_versions
    ADD CONSTRAINT operation_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 4048 (class 2606 OID 278545)
-- Name: optimization_algorithms optimization_algorithms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_algorithms
    ADD CONSTRAINT optimization_algorithms_pkey PRIMARY KEY (id);


--
-- TOC entry 4060 (class 2606 OID 278683)
-- Name: optimization_profiles optimization_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_profiles
    ADD CONSTRAINT optimization_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 4062 (class 2606 OID 278708)
-- Name: optimization_runs optimization_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_runs
    ADD CONSTRAINT optimization_runs_pkey PRIMARY KEY (id);


--
-- TOC entry 4064 (class 2606 OID 278736)
-- Name: optimization_scope_configs optimization_scope_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_scope_configs
    ADD CONSTRAINT optimization_scope_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 3985 (class 2606 OID 81945)
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- TOC entry 3987 (class 2606 OID 81943)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4149 (class 2606 OID 663566)
-- Name: planning_areas planning_areas_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_areas
    ADD CONSTRAINT planning_areas_name_key UNIQUE (name);


--
-- TOC entry 4151 (class 2606 OID 663564)
-- Name: planning_areas planning_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_areas
    ADD CONSTRAINT planning_areas_pkey PRIMARY KEY (id);


--
-- TOC entry 4098 (class 2606 OID 368670)
-- Name: plant_kpi_performance plant_kpi_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plant_kpi_performance
    ADD CONSTRAINT plant_kpi_performance_pkey PRIMARY KEY (id);


--
-- TOC entry 4096 (class 2606 OID 368655)
-- Name: plant_kpi_targets plant_kpi_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plant_kpi_targets
    ADD CONSTRAINT plant_kpi_targets_pkey PRIMARY KEY (id);


--
-- TOC entry 4134 (class 2606 OID 483355)
-- Name: playbook_usage playbook_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbook_usage
    ADD CONSTRAINT playbook_usage_pkey PRIMARY KEY (id);


--
-- TOC entry 4132 (class 2606 OID 483340)
-- Name: playbooks playbooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbooks
    ADD CONSTRAINT playbooks_pkey PRIMARY KEY (id);


--
-- TOC entry 4042 (class 2606 OID 155717)
-- Name: pt_product_wheel_performance pt_product_wheel_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheel_performance
    ADD CONSTRAINT pt_product_wheel_performance_pkey PRIMARY KEY (id);


--
-- TOC entry 4040 (class 2606 OID 155703)
-- Name: pt_product_wheel_schedule pt_product_wheel_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheel_schedule
    ADD CONSTRAINT pt_product_wheel_schedule_pkey PRIMARY KEY (id);


--
-- TOC entry 4038 (class 2606 OID 155681)
-- Name: pt_product_wheel_segments pt_product_wheel_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheel_segments
    ADD CONSTRAINT pt_product_wheel_segments_pkey PRIMARY KEY (id);


--
-- TOC entry 4036 (class 2606 OID 155660)
-- Name: pt_product_wheels pt_product_wheels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheels
    ADD CONSTRAINT pt_product_wheels_pkey PRIMARY KEY (id);


--
-- TOC entry 3959 (class 2606 OID 24631)
-- Name: ptjobactivities ptjobactivities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjobactivities
    ADD CONSTRAINT ptjobactivities_pkey PRIMARY KEY (id);


--
-- TOC entry 3957 (class 2606 OID 24615)
-- Name: ptjoboperations ptjoboperations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjoboperations
    ADD CONSTRAINT ptjoboperations_pkey PRIMARY KEY (id);


--
-- TOC entry 3961 (class 2606 OID 24646)
-- Name: ptjobresources ptjobresources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjobresources
    ADD CONSTRAINT ptjobresources_pkey PRIMARY KEY (id);


--
-- TOC entry 3955 (class 2606 OID 24603)
-- Name: ptjobs ptjobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjobs
    ADD CONSTRAINT ptjobs_pkey PRIMARY KEY (id);


--
-- TOC entry 3963 (class 2606 OID 24662)
-- Name: ptplants ptplants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptplants
    ADD CONSTRAINT ptplants_pkey PRIMARY KEY (id);


--
-- TOC entry 3977 (class 2606 OID 65542)
-- Name: ptresourcecapabilities ptresourcecapabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptresourcecapabilities
    ADD CONSTRAINT ptresourcecapabilities_pkey PRIMARY KEY (id);


--
-- TOC entry 3951 (class 2606 OID 24589)
-- Name: ptresources ptresources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptresources
    ADD CONSTRAINT ptresources_pkey PRIMARY KEY (id);


--
-- TOC entry 3953 (class 2606 OID 24591)
-- Name: ptresources ptresources_resource_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptresources
    ADD CONSTRAINT ptresources_resource_id_key UNIQUE (resource_id);


--
-- TOC entry 3975 (class 2606 OID 57396)
-- Name: recent_pages recent_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recent_pages
    ADD CONSTRAINT recent_pages_pkey PRIMARY KEY (id);


--
-- TOC entry 3991 (class 2606 OID 81974)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3993 (class 2606 OID 81976)
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- TOC entry 3981 (class 2606 OID 81933)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 3983 (class 2606 OID 81931)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4102 (class 2606 OID 434193)
-- Name: saved_forecasts saved_forecasts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_forecasts
    ADD CONSTRAINT saved_forecasts_pkey PRIMARY KEY (id);


--
-- TOC entry 3979 (class 2606 OID 73740)
-- Name: saved_schedules saved_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_schedules
    ADD CONSTRAINT saved_schedules_pkey PRIMARY KEY (id);


--
-- TOC entry 4085 (class 2606 OID 294993)
-- Name: schedule_locks schedule_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_locks
    ADD CONSTRAINT schedule_locks_pkey PRIMARY KEY (id);


--
-- TOC entry 4075 (class 2606 OID 294925)
-- Name: schedule_versions schedule_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_versions
    ADD CONSTRAINT schedule_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 4147 (class 2606 OID 507916)
-- Name: tours tours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_pkey PRIMARY KEY (id);


--
-- TOC entry 3971 (class 2606 OID 57360)
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 3989 (class 2606 OID 81951)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- TOC entry 3965 (class 2606 OID 49167)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3967 (class 2606 OID 49163)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3969 (class 2606 OID 49165)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4081 (class 2606 OID 294967)
-- Name: version_comparisons version_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_comparisons
    ADD CONSTRAINT version_comparisons_pkey PRIMARY KEY (id);


--
-- TOC entry 4088 (class 2606 OID 295014)
-- Name: version_rollbacks version_rollbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_rollbacks
    ADD CONSTRAINT version_rollbacks_pkey PRIMARY KEY (id);


--
-- TOC entry 3997 (class 2606 OID 82025)
-- Name: widget_types widget_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widget_types
    ADD CONSTRAINT widget_types_pkey PRIMARY KEY (id);


--
-- TOC entry 3999 (class 2606 OID 82039)
-- Name: widgets widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT widgets_pkey PRIMARY KEY (id);


--
-- TOC entry 4024 (class 1259 OID 106626)
-- Name: idx_agent_actions_connection_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_actions_connection_timestamp ON public.agent_actions USING btree (agent_connection_id, "timestamp");


--
-- TOC entry 4025 (class 1259 OID 106627)
-- Name: idx_agent_actions_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_actions_session ON public.agent_actions USING btree (session_id);


--
-- TOC entry 4020 (class 1259 OID 106625)
-- Name: idx_agent_connections_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_connections_agent_id ON public.agent_connections USING btree (agent_id);


--
-- TOC entry 4021 (class 1259 OID 106624)
-- Name: idx_agent_connections_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_connections_status ON public.agent_connections USING btree (status);


--
-- TOC entry 4028 (class 1259 OID 106628)
-- Name: idx_agent_metrics_connection_hour; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agent_metrics_connection_hour ON public.agent_metrics_hourly USING btree (agent_connection_id, hour_timestamp);


--
-- TOC entry 4141 (class 1259 OID 491616)
-- Name: idx_onboarding_docs_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_docs_category ON public.onboarding_documents USING btree (category);


--
-- TOC entry 4142 (class 1259 OID 491617)
-- Name: idx_onboarding_docs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_docs_type ON public.onboarding_documents USING btree (document_type);


--
-- TOC entry 4143 (class 1259 OID 491615)
-- Name: idx_onboarding_docs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_docs_user ON public.onboarding_documents USING btree (user_id);


--
-- TOC entry 4076 (class 1259 OID 294955)
-- Name: idx_operation_versions_operation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operation_versions_operation_id ON public.operation_versions USING btree (operation_id);


--
-- TOC entry 4077 (class 1259 OID 294956)
-- Name: idx_operation_versions_version_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operation_versions_version_id ON public.operation_versions USING btree (version_id);


--
-- TOC entry 4082 (class 1259 OID 295036)
-- Name: idx_schedule_locks_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_locks_is_active ON public.schedule_locks USING btree (is_active);


--
-- TOC entry 4083 (class 1259 OID 295035)
-- Name: idx_schedule_locks_schedule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_locks_schedule_id ON public.schedule_locks USING btree (schedule_id);


--
-- TOC entry 4071 (class 1259 OID 294933)
-- Name: idx_schedule_versions_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_versions_created_by ON public.schedule_versions USING btree (created_by);


--
-- TOC entry 4072 (class 1259 OID 294931)
-- Name: idx_schedule_versions_schedule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_versions_schedule_id ON public.schedule_versions USING btree (schedule_id);


--
-- TOC entry 4073 (class 1259 OID 294932)
-- Name: idx_schedule_versions_version_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_versions_version_number ON public.schedule_versions USING btree (version_number);


--
-- TOC entry 4086 (class 1259 OID 295037)
-- Name: idx_version_rollbacks_schedule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_version_rollbacks_schedule_id ON public.version_rollbacks USING btree (schedule_id);


--
-- TOC entry 4129 (class 1259 OID 467002)
-- Name: llm_usage_provider_feature_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX llm_usage_provider_feature_idx ON public.llm_usage_logs USING btree (provider_id, feature);


--
-- TOC entry 4130 (class 1259 OID 467003)
-- Name: llm_usage_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX llm_usage_timestamp_idx ON public.llm_usage_logs USING btree ("timestamp");


--
-- TOC entry 4170 (class 2606 OID 106556)
-- Name: agent_actions agent_actions_agent_connection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_actions
    ADD CONSTRAINT agent_actions_agent_connection_id_fkey FOREIGN KEY (agent_connection_id) REFERENCES public.agent_connections(id);


--
-- TOC entry 4175 (class 2606 OID 106619)
-- Name: agent_alerts agent_alerts_acknowledged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_alerts
    ADD CONSTRAINT agent_alerts_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.users(id);


--
-- TOC entry 4176 (class 2606 OID 106614)
-- Name: agent_alerts agent_alerts_agent_connection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_alerts
    ADD CONSTRAINT agent_alerts_agent_connection_id_fkey FOREIGN KEY (agent_connection_id) REFERENCES public.agent_connections(id);


--
-- TOC entry 4168 (class 2606 OID 106536)
-- Name: agent_connections agent_connections_api_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_connections
    ADD CONSTRAINT agent_connections_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES public.api_keys(id);


--
-- TOC entry 4169 (class 2606 OID 106541)
-- Name: agent_connections agent_connections_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_connections
    ADD CONSTRAINT agent_connections_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES public.oauth_clients(id);


--
-- TOC entry 4171 (class 2606 OID 106572)
-- Name: agent_metrics_hourly agent_metrics_hourly_agent_connection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_metrics_hourly
    ADD CONSTRAINT agent_metrics_hourly_agent_connection_id_fkey FOREIGN KEY (agent_connection_id) REFERENCES public.agent_connections(id);


--
-- TOC entry 4172 (class 2606 OID 106588)
-- Name: agent_policies agent_policies_agent_connection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_policies
    ADD CONSTRAINT agent_policies_agent_connection_id_fkey FOREIGN KEY (agent_connection_id) REFERENCES public.agent_connections(id);


--
-- TOC entry 4173 (class 2606 OID 106598)
-- Name: agent_policies agent_policies_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_policies
    ADD CONSTRAINT agent_policies_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- TOC entry 4174 (class 2606 OID 106593)
-- Name: agent_policies agent_policies_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_policies
    ADD CONSTRAINT agent_policies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4246 (class 2606 OID 491564)
-- Name: agent_recommendations agent_recommendations_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommendations
    ADD CONSTRAINT agent_recommendations_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.ai_agent_team(id);


--
-- TOC entry 4247 (class 2606 OID 491574)
-- Name: agent_recommendations agent_recommendations_applied_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommendations
    ADD CONSTRAINT agent_recommendations_applied_by_fkey FOREIGN KEY (applied_by) REFERENCES public.users(id);


--
-- TOC entry 4248 (class 2606 OID 491579)
-- Name: agent_recommendations agent_recommendations_dismissed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommendations
    ADD CONSTRAINT agent_recommendations_dismissed_by_fkey FOREIGN KEY (dismissed_by) REFERENCES public.users(id);


--
-- TOC entry 4249 (class 2606 OID 491569)
-- Name: agent_recommendations agent_recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommendations
    ADD CONSTRAINT agent_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4197 (class 2606 OID 278591)
-- Name: algorithm_deployments algorithm_deployments_algorithm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_deployments
    ADD CONSTRAINT algorithm_deployments_algorithm_id_fkey FOREIGN KEY (algorithm_id) REFERENCES public.optimization_algorithms(id);


--
-- TOC entry 4198 (class 2606 OID 278596)
-- Name: algorithm_deployments algorithm_deployments_deployed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_deployments
    ADD CONSTRAINT algorithm_deployments_deployed_by_fkey FOREIGN KEY (deployed_by) REFERENCES public.users(id);


--
-- TOC entry 4201 (class 2606 OID 278638)
-- Name: algorithm_feedback_comments algorithm_feedback_comments_feedback_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback_comments
    ADD CONSTRAINT algorithm_feedback_comments_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.algorithm_feedback(id);


--
-- TOC entry 4202 (class 2606 OID 278643)
-- Name: algorithm_feedback_comments algorithm_feedback_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback_comments
    ADD CONSTRAINT algorithm_feedback_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4199 (class 2606 OID 278622)
-- Name: algorithm_feedback algorithm_feedback_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback
    ADD CONSTRAINT algorithm_feedback_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- TOC entry 4200 (class 2606 OID 278617)
-- Name: algorithm_feedback algorithm_feedback_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback
    ADD CONSTRAINT algorithm_feedback_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id);


--
-- TOC entry 4203 (class 2606 OID 278656)
-- Name: algorithm_feedback_votes algorithm_feedback_votes_feedback_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback_votes
    ADD CONSTRAINT algorithm_feedback_votes_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.algorithm_feedback(id);


--
-- TOC entry 4204 (class 2606 OID 278661)
-- Name: algorithm_feedback_votes algorithm_feedback_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_feedback_votes
    ADD CONSTRAINT algorithm_feedback_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4213 (class 2606 OID 278776)
-- Name: algorithm_governance_approvals algorithm_governance_approvals_algorithm_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_governance_approvals
    ADD CONSTRAINT algorithm_governance_approvals_algorithm_version_id_fkey FOREIGN KEY (algorithm_version_id) REFERENCES public.optimization_algorithms(id);


--
-- TOC entry 4214 (class 2606 OID 278781)
-- Name: algorithm_governance_approvals algorithm_governance_approvals_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_governance_approvals
    ADD CONSTRAINT algorithm_governance_approvals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- TOC entry 4195 (class 2606 OID 278568)
-- Name: algorithm_tests algorithm_tests_algorithm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_tests
    ADD CONSTRAINT algorithm_tests_algorithm_id_fkey FOREIGN KEY (algorithm_id) REFERENCES public.optimization_algorithms(id);


--
-- TOC entry 4196 (class 2606 OID 278573)
-- Name: algorithm_tests algorithm_tests_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.algorithm_tests
    ADD CONSTRAINT algorithm_tests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4231 (class 2606 OID 368702)
-- Name: autonomous_optimization autonomous_optimization_plant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.autonomous_optimization
    ADD CONSTRAINT autonomous_optimization_plant_id_fkey FOREIGN KEY (plant_id) REFERENCES public.ptplants(id);


--
-- TOC entry 4184 (class 2606 OID 270385)
-- Name: calendars calendars_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendars
    ADD CONSTRAINT calendars_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4185 (class 2606 OID 270375)
-- Name: calendars calendars_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendars
    ADD CONSTRAINT calendars_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.ptjobs(id);


--
-- TOC entry 4186 (class 2606 OID 270380)
-- Name: calendars calendars_plant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendars
    ADD CONSTRAINT calendars_plant_id_fkey FOREIGN KEY (plant_id) REFERENCES public.ptplants(id);


--
-- TOC entry 4187 (class 2606 OID 270370)
-- Name: calendars calendars_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendars
    ADD CONSTRAINT calendars_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.ptresources(id);


--
-- TOC entry 4156 (class 2606 OID 57382)
-- Name: company_onboarding company_onboarding_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_onboarding
    ADD CONSTRAINT company_onboarding_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4164 (class 2606 OID 82001)
-- Name: dashboards dashboards_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboards
    ADD CONSTRAINT dashboards_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4165 (class 2606 OID 82006)
-- Name: dashboards dashboards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboards
    ADD CONSTRAINT dashboards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4237 (class 2606 OID 458844)
-- Name: ddmrp_alerts ddmrp_alerts_acknowledged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_alerts
    ADD CONSTRAINT ddmrp_alerts_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.users(id);


--
-- TOC entry 4238 (class 2606 OID 458839)
-- Name: ddmrp_alerts ddmrp_alerts_buffer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_alerts
    ADD CONSTRAINT ddmrp_alerts_buffer_id_fkey FOREIGN KEY (buffer_id) REFERENCES public.ddmrp_buffers(id);


--
-- TOC entry 4234 (class 2606 OID 458789)
-- Name: ddmrp_buffer_history ddmrp_buffer_history_buffer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_buffer_history
    ADD CONSTRAINT ddmrp_buffer_history_buffer_id_fkey FOREIGN KEY (buffer_id) REFERENCES public.ddmrp_buffers(id);


--
-- TOC entry 4233 (class 2606 OID 458771)
-- Name: ddmrp_buffers ddmrp_buffers_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_buffers
    ADD CONSTRAINT ddmrp_buffers_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- TOC entry 4235 (class 2606 OID 458804)
-- Name: ddmrp_demand_history ddmrp_demand_history_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_demand_history
    ADD CONSTRAINT ddmrp_demand_history_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- TOC entry 4236 (class 2606 OID 458823)
-- Name: ddmrp_supply_orders ddmrp_supply_orders_buffer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddmrp_supply_orders
    ADD CONSTRAINT ddmrp_supply_orders_buffer_id_fkey FOREIGN KEY (buffer_id) REFERENCES public.ddmrp_buffers(id);


--
-- TOC entry 4211 (class 2606 OID 278753)
-- Name: extension_data extension_data_algorithm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extension_data
    ADD CONSTRAINT extension_data_algorithm_id_fkey FOREIGN KEY (algorithm_id) REFERENCES public.optimization_algorithms(id);


--
-- TOC entry 4212 (class 2606 OID 278758)
-- Name: extension_data extension_data_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extension_data
    ADD CONSTRAINT extension_data_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4215 (class 2606 OID 278800)
-- Name: governance_deployments governance_deployments_plant_approval_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.governance_deployments
    ADD CONSTRAINT governance_deployments_plant_approval_id_fkey FOREIGN KEY (plant_approval_id) REFERENCES public.algorithm_governance_approvals(id);


--
-- TOC entry 4239 (class 2606 OID 466972)
-- Name: llm_provider_config llm_provider_config_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_provider_config
    ADD CONSTRAINT llm_provider_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4240 (class 2606 OID 466977)
-- Name: llm_provider_config llm_provider_config_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_provider_config
    ADD CONSTRAINT llm_provider_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- TOC entry 4241 (class 2606 OID 466992)
-- Name: llm_usage_logs llm_usage_logs_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_usage_logs
    ADD CONSTRAINT llm_usage_logs_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.llm_provider_config(id);


--
-- TOC entry 4242 (class 2606 OID 466997)
-- Name: llm_usage_logs llm_usage_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_usage_logs
    ADD CONSTRAINT llm_usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4188 (class 2606 OID 270420)
-- Name: maintenance_periods maintenance_periods_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_periods
    ADD CONSTRAINT maintenance_periods_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id);


--
-- TOC entry 4189 (class 2606 OID 270425)
-- Name: maintenance_periods maintenance_periods_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_periods
    ADD CONSTRAINT maintenance_periods_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4190 (class 2606 OID 270410)
-- Name: maintenance_periods maintenance_periods_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_periods
    ADD CONSTRAINT maintenance_periods_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.ptjobs(id);


--
-- TOC entry 4191 (class 2606 OID 270415)
-- Name: maintenance_periods maintenance_periods_plant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_periods
    ADD CONSTRAINT maintenance_periods_plant_id_fkey FOREIGN KEY (plant_id) REFERENCES public.ptplants(id);


--
-- TOC entry 4192 (class 2606 OID 270405)
-- Name: maintenance_periods maintenance_periods_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_periods
    ADD CONSTRAINT maintenance_periods_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.ptresources(id);


--
-- TOC entry 4177 (class 2606 OID 122890)
-- Name: max_chat_messages max_chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.max_chat_messages
    ADD CONSTRAINT max_chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4250 (class 2606 OID 491610)
-- Name: onboarding_documents onboarding_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_documents
    ADD CONSTRAINT onboarding_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4217 (class 2606 OID 294945)
-- Name: operation_versions operation_versions_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_versions
    ADD CONSTRAINT operation_versions_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES public.ptjoboperations(id);


--
-- TOC entry 4218 (class 2606 OID 294950)
-- Name: operation_versions operation_versions_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_versions
    ADD CONSTRAINT operation_versions_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.schedule_versions(id);


--
-- TOC entry 4193 (class 2606 OID 278546)
-- Name: optimization_algorithms optimization_algorithms_base_algorithm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_algorithms
    ADD CONSTRAINT optimization_algorithms_base_algorithm_id_fkey FOREIGN KEY (base_algorithm_id) REFERENCES public.optimization_algorithms(id);


--
-- TOC entry 4194 (class 2606 OID 278551)
-- Name: optimization_algorithms optimization_algorithms_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_algorithms
    ADD CONSTRAINT optimization_algorithms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4205 (class 2606 OID 278684)
-- Name: optimization_profiles optimization_profiles_algorithm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_profiles
    ADD CONSTRAINT optimization_profiles_algorithm_id_fkey FOREIGN KEY (algorithm_id) REFERENCES public.optimization_algorithms(id);


--
-- TOC entry 4206 (class 2606 OID 278689)
-- Name: optimization_profiles optimization_profiles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_profiles
    ADD CONSTRAINT optimization_profiles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4207 (class 2606 OID 278709)
-- Name: optimization_runs optimization_runs_algorithm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_runs
    ADD CONSTRAINT optimization_runs_algorithm_id_fkey FOREIGN KEY (algorithm_id) REFERENCES public.optimization_algorithms(id);


--
-- TOC entry 4208 (class 2606 OID 278719)
-- Name: optimization_runs optimization_runs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_runs
    ADD CONSTRAINT optimization_runs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4209 (class 2606 OID 278714)
-- Name: optimization_runs optimization_runs_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_runs
    ADD CONSTRAINT optimization_runs_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.optimization_profiles(id);


--
-- TOC entry 4210 (class 2606 OID 278737)
-- Name: optimization_scope_configs optimization_scope_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optimization_scope_configs
    ADD CONSTRAINT optimization_scope_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4229 (class 2606 OID 368676)
-- Name: plant_kpi_performance plant_kpi_performance_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plant_kpi_performance
    ADD CONSTRAINT plant_kpi_performance_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4230 (class 2606 OID 368671)
-- Name: plant_kpi_performance plant_kpi_performance_plant_kpi_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plant_kpi_performance
    ADD CONSTRAINT plant_kpi_performance_plant_kpi_target_id_fkey FOREIGN KEY (plant_kpi_target_id) REFERENCES public.plant_kpi_targets(id);


--
-- TOC entry 4228 (class 2606 OID 368656)
-- Name: plant_kpi_targets plant_kpi_targets_plant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plant_kpi_targets
    ADD CONSTRAINT plant_kpi_targets_plant_id_fkey FOREIGN KEY (plant_id) REFERENCES public.ptplants(id);


--
-- TOC entry 4244 (class 2606 OID 483356)
-- Name: playbook_usage playbook_usage_playbook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbook_usage
    ADD CONSTRAINT playbook_usage_playbook_id_fkey FOREIGN KEY (playbook_id) REFERENCES public.playbooks(id);


--
-- TOC entry 4245 (class 2606 OID 483361)
-- Name: playbook_usage playbook_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbook_usage
    ADD CONSTRAINT playbook_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4243 (class 2606 OID 483341)
-- Name: playbooks playbooks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playbooks
    ADD CONSTRAINT playbooks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4183 (class 2606 OID 155718)
-- Name: pt_product_wheel_performance pt_product_wheel_performance_wheel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheel_performance
    ADD CONSTRAINT pt_product_wheel_performance_wheel_id_fkey FOREIGN KEY (wheel_id) REFERENCES public.pt_product_wheels(id) ON DELETE CASCADE;


--
-- TOC entry 4182 (class 2606 OID 155704)
-- Name: pt_product_wheel_schedule pt_product_wheel_schedule_wheel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheel_schedule
    ADD CONSTRAINT pt_product_wheel_schedule_wheel_id_fkey FOREIGN KEY (wheel_id) REFERENCES public.pt_product_wheels(id) ON DELETE CASCADE;


--
-- TOC entry 4180 (class 2606 OID 155687)
-- Name: pt_product_wheel_segments pt_product_wheel_segments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheel_segments
    ADD CONSTRAINT pt_product_wheel_segments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.ptjobs(id);


--
-- TOC entry 4181 (class 2606 OID 155682)
-- Name: pt_product_wheel_segments pt_product_wheel_segments_wheel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheel_segments
    ADD CONSTRAINT pt_product_wheel_segments_wheel_id_fkey FOREIGN KEY (wheel_id) REFERENCES public.pt_product_wheels(id) ON DELETE CASCADE;


--
-- TOC entry 4178 (class 2606 OID 155666)
-- Name: pt_product_wheels pt_product_wheels_plant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheels
    ADD CONSTRAINT pt_product_wheels_plant_id_fkey FOREIGN KEY (plant_id) REFERENCES public.ptplants(id);


--
-- TOC entry 4179 (class 2606 OID 155661)
-- Name: pt_product_wheels pt_product_wheels_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pt_product_wheels
    ADD CONSTRAINT pt_product_wheels_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.ptresources(id);


--
-- TOC entry 4153 (class 2606 OID 24632)
-- Name: ptjobactivities ptjobactivities_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjobactivities
    ADD CONSTRAINT ptjobactivities_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES public.ptjoboperations(id);


--
-- TOC entry 4152 (class 2606 OID 24616)
-- Name: ptjoboperations ptjoboperations_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjoboperations
    ADD CONSTRAINT ptjoboperations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.ptjobs(id);


--
-- TOC entry 4154 (class 2606 OID 24647)
-- Name: ptjobresources ptjobresources_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ptjobresources
    ADD CONSTRAINT ptjobresources_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES public.ptjoboperations(id);


--
-- TOC entry 4157 (class 2606 OID 57397)
-- Name: recent_pages recent_pages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recent_pages
    ADD CONSTRAINT recent_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4162 (class 2606 OID 81982)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- TOC entry 4163 (class 2606 OID 81977)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4232 (class 2606 OID 434194)
-- Name: saved_forecasts saved_forecasts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_forecasts
    ADD CONSTRAINT saved_forecasts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4158 (class 2606 OID 73741)
-- Name: saved_schedules saved_schedules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_schedules
    ADD CONSTRAINT saved_schedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4222 (class 2606 OID 294999)
-- Name: schedule_locks schedule_locks_locked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_locks
    ADD CONSTRAINT schedule_locks_locked_by_fkey FOREIGN KEY (locked_by) REFERENCES public.users(id);


--
-- TOC entry 4223 (class 2606 OID 294994)
-- Name: schedule_locks schedule_locks_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_locks
    ADD CONSTRAINT schedule_locks_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.schedule_versions(id);


--
-- TOC entry 4216 (class 2606 OID 294926)
-- Name: schedule_versions schedule_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_versions
    ADD CONSTRAINT schedule_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4251 (class 2606 OID 507922)
-- Name: tours tours_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4252 (class 2606 OID 507917)
-- Name: tours tours_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4155 (class 2606 OID 57361)
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4159 (class 2606 OID 81962)
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- TOC entry 4160 (class 2606 OID 81957)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4161 (class 2606 OID 81952)
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4219 (class 2606 OID 294978)
-- Name: version_comparisons version_comparisons_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_comparisons
    ADD CONSTRAINT version_comparisons_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4220 (class 2606 OID 294968)
-- Name: version_comparisons version_comparisons_version_id_1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_comparisons
    ADD CONSTRAINT version_comparisons_version_id_1_fkey FOREIGN KEY (version_id_1) REFERENCES public.schedule_versions(id);


--
-- TOC entry 4221 (class 2606 OID 294973)
-- Name: version_comparisons version_comparisons_version_id_2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_comparisons
    ADD CONSTRAINT version_comparisons_version_id_2_fkey FOREIGN KEY (version_id_2) REFERENCES public.schedule_versions(id);


--
-- TOC entry 4224 (class 2606 OID 295030)
-- Name: version_rollbacks version_rollbacks_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_rollbacks
    ADD CONSTRAINT version_rollbacks_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- TOC entry 4225 (class 2606 OID 295015)
-- Name: version_rollbacks version_rollbacks_from_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_rollbacks
    ADD CONSTRAINT version_rollbacks_from_version_id_fkey FOREIGN KEY (from_version_id) REFERENCES public.schedule_versions(id);


--
-- TOC entry 4226 (class 2606 OID 295025)
-- Name: version_rollbacks version_rollbacks_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_rollbacks
    ADD CONSTRAINT version_rollbacks_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id);


--
-- TOC entry 4227 (class 2606 OID 295020)
-- Name: version_rollbacks version_rollbacks_to_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.version_rollbacks
    ADD CONSTRAINT version_rollbacks_to_version_id_fkey FOREIGN KEY (to_version_id) REFERENCES public.schedule_versions(id);


--
-- TOC entry 4166 (class 2606 OID 82040)
-- Name: widgets widgets_dashboard_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT widgets_dashboard_id_fkey FOREIGN KEY (dashboard_id) REFERENCES public.dashboards(id);


--
-- TOC entry 4167 (class 2606 OID 82045)
-- Name: widgets widgets_widget_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT widgets_widget_type_id_fkey FOREIGN KEY (widget_type_id) REFERENCES public.widget_types(id);


-- Completed on 2025-11-06 19:53:16 UTC

--
-- PostgreSQL database dump complete
--

