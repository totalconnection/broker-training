CREATE TABLE IF NOT EXISTS enrollments(user_id text PRIMARY KEY,role text NOT NULL DEFAULT 'owner' CHECK(role IN ('owner','agent')),plan text NOT NULL DEFAULT 'core' CHECK(plan IN ('core','premium')),is_admin boolean NOT NULL DEFAULT false,expires_at timestamptz NOT NULL,checkout_id text);
CREATE TABLE IF NOT EXISTS workspace_items(id uuid PRIMARY KEY,user_id text NOT NULL,kind text NOT NULL,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS workspace_owner_kind ON workspace_items(user_id,kind);
CREATE TABLE IF NOT EXISTS lesson_publications(lesson_id text PRIMARY KEY,published boolean NOT NULL DEFAULT false,vimeo text NOT NULL DEFAULT '',pdf_key text NOT NULL DEFAULT '',updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS payment_events(id text PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS orders(checkout_id text PRIMARY KEY,user_id text NOT NULL,payment_intent text,status text NOT NULL DEFAULT 'paid');
CREATE TABLE IF NOT EXISTS owner_setup_claims(token_hash text PRIMARY KEY,user_id text NOT NULL,claimed_at timestamptz NOT NULL DEFAULT now());
