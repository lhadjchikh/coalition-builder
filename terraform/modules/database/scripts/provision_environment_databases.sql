SELECT EXISTS (
  SELECT FROM pg_database WHERE datname = :'prod_database'
) AS prod_database_exists \gset
\if :prod_database_exists
\else
  \echo 'Production database does not exist; refusing to create or replace it.'
  \quit 3
\endif

SELECT EXISTS (SELECT FROM pg_roles WHERE rolname = :'prod_user') AS prod_user_exists \gset
SELECT EXISTS (SELECT FROM pg_roles WHERE rolname = :'dev_user') AS dev_user_exists \gset
\if :prod_user_exists
\else
  \echo 'Production application role does not exist.'
  \quit 4
\endif
\if :dev_user_exists
\else
  \echo 'Development application role does not exist.'
  \quit 5
\endif

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
