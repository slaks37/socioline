ALTER TABLE jobs ADD COLUMN IF NOT EXISTS seed integer NOT NULL DEFAULT floor(random()*2147483646)::integer;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT now()+interval '30 days';
INSERT INTO schema_versions(version) VALUES(2) ON CONFLICT DO NOTHING;
