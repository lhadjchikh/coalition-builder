SELECT format(
  $sql$
DO $guard$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = %L) THEN
    RAISE EXCEPTION 'Production database does not exist; refusing to create or replace it.';
  END IF;
END
$guard$;
$sql$,
  :'prod_database'
) \gexec

SELECT format(
  $sql$
DO $guard$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = %L) THEN
    RAISE EXCEPTION 'Production application role does not exist.';
  END IF;
END
$guard$;
$sql$,
  :'prod_user'
) \gexec

SELECT format(
  $sql$
DO $guard$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = %L) THEN
    RAISE EXCEPTION 'Development application role does not exist.';
  END IF;
END
$guard$;
$sql$,
  :'dev_user'
) \gexec

SELECT format(
  $sql$
DO $guard$
DECLARE
  application_role RECORD;
BEGIN
  FOR application_role IN
    SELECT rolname, rolsuper, rolcreatedb, rolcreaterole
    FROM pg_roles
    WHERE rolname IN (%L, %L)
  LOOP
    IF application_role.rolsuper
      OR application_role.rolcreatedb
      OR application_role.rolcreaterole
      OR pg_has_role(application_role.rolname, 'rds_superuser', 'member')
    THEN
      RAISE EXCEPTION 'Application role privileges can bypass database isolation.';
    END IF;
  END LOOP;

  IF pg_has_role(%L, %L, 'member')
    OR pg_has_role(%L, %L, 'member')
  THEN
    RAISE EXCEPTION 'Application roles must not inherit from each other.';
  END IF;
END
$guard$;
$sql$,
  :'prod_user',
  :'dev_user',
  :'prod_user',
  :'dev_user',
  :'dev_user',
  :'prod_user'
) \gexec

SELECT format('CREATE DATABASE %I', :'dev_database')
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = :'dev_database'
) \gexec

SELECT format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', :'prod_database') \gexec
SELECT format('REVOKE CONNECT ON DATABASE %I FROM %I', :'prod_database', :'dev_user') \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', :'prod_database', :'prod_user') \gexec
SELECT format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', :'dev_database') \gexec
SELECT format('REVOKE CONNECT ON DATABASE %I FROM %I', :'dev_database', :'prod_user') \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', :'dev_database', :'dev_user') \gexec

\connect :prod_database
REVOKE ALL PRIVILEGES ON SCHEMA public FROM :"dev_user";
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM :"dev_user";
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM :"dev_user";
GRANT USAGE, CREATE ON SCHEMA public TO :"prod_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"prod_user";
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO :"prod_user";
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO :"prod_user";

\connect :dev_database
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM :"prod_user";
GRANT USAGE, CREATE ON SCHEMA public TO :"dev_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"dev_user";
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO :"dev_user";
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO :"dev_user";
