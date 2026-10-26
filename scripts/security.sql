-- Server-derived identity only. The application role cannot log in or bypass RLS.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='freightskills_app_data') THEN
  CREATE ROLE freightskills_app_data NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
 END IF;
 EXECUTE format('GRANT freightskills_app_data TO %I', current_user);
END $$;
ALTER ROLE freightskills_app_data NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO freightskills_app_data;
GRANT SELECT,INSERT,UPDATE,DELETE ON workspace_items TO freightskills_app_data;
GRANT SELECT ON enrollments,product_enrollments,lesson_publications TO freightskills_app_data;
GRANT UPDATE(role) ON enrollments TO freightskills_app_data;
GRANT INSERT,UPDATE ON lesson_publications TO freightskills_app_data;
ALTER TABLE workspace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspace_read ON workspace_items;
CREATE POLICY workspace_read ON workspace_items FOR SELECT TO freightskills_app_data USING (
 user_id = nullif(current_setting('app.user_id',true),'')
 OR current_setting('app.is_admin',true)='true'
 OR (user_id='teaching-content' AND kind IN ('teaching_course','knowledge_settings') AND nullif(current_setting('app.user_id',true),'') IS NOT NULL)
);
DROP POLICY IF EXISTS workspace_write ON workspace_items;
CREATE POLICY workspace_write ON workspace_items FOR ALL TO freightskills_app_data USING (
 user_id=nullif(current_setting('app.user_id',true),'') OR (user_id='teaching-content' AND current_setting('app.is_admin',true)='true')
) WITH CHECK (
 user_id=nullif(current_setting('app.user_id',true),'') OR (user_id='teaching-content' AND current_setting('app.is_admin',true)='true')
);
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enrollment_read ON enrollments;
CREATE POLICY enrollment_read ON enrollments FOR SELECT TO freightskills_app_data USING(user_id=nullif(current_setting('app.user_id',true),''));
DROP POLICY IF EXISTS enrollment_path ON enrollments;
CREATE POLICY enrollment_path ON enrollments FOR UPDATE TO freightskills_app_data USING(user_id=nullif(current_setting('app.user_id',true),'')) WITH CHECK(user_id=nullif(current_setting('app.user_id',true),''));
ALTER TABLE product_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_enrollments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS products_read ON product_enrollments;
CREATE POLICY products_read ON product_enrollments FOR SELECT TO freightskills_app_data USING(user_id=nullif(current_setting('app.user_id',true),''));
ALTER TABLE lesson_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_publications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS publications_read ON lesson_publications;
CREATE POLICY publications_read ON lesson_publications FOR SELECT TO freightskills_app_data USING(published OR current_setting('app.is_admin',true)='true');
DROP POLICY IF EXISTS publications_write ON lesson_publications;
CREATE POLICY publications_write ON lesson_publications FOR ALL TO freightskills_app_data USING(current_setting('app.is_admin',true)='true') WITH CHECK(current_setting('app.is_admin',true)='true');
-- Privileged server operations (auth, enrollment provisioning, billing, budgets and
-- admin roster) retain their separate trusted connection. No browser DB access.
-- FORCE RLS also applies to non-superuser table owners: explicitly allow only the
-- migration/service role, never PUBLIC or the restricted application role.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['workspace_items','enrollments','product_enrollments','lesson_publications'] LOOP
  EXECUTE format('DROP POLICY IF EXISTS service_operations ON %I',t);
  EXECUTE format('CREATE POLICY service_operations ON %I FOR ALL TO %I USING (current_user <> %L) WITH CHECK (current_user <> %L)',t,current_user,'freightskills_app_data','freightskills_app_data');
 END LOOP;
END $$;
COMMIT;
