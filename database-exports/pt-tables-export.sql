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
-- Data for Name: ptplants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Data for Name: ptresources; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Name: ptplants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.ptplants_id_seq', 1, false);


--
-- Name: ptresources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.ptresources_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

