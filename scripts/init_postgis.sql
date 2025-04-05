-- Script to initialize PostGIS extension in the database
-- Run this script as a database superuser before running the application

CREATE EXTENSION IF NOT EXISTS postgis;

-- Confirm the extension is installed
SELECT postgis_version();