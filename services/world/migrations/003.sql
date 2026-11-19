CREATE TABLE IF NOT EXISTS avatars(guest_id uuid PRIMARY KEY REFERENCES guests(id),look jsonb NOT NULL,updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS simulation(world_id uuid PRIMARY KEY REFERENCES worlds(id),cycle bigint NOT NULL,completed_rounds bigint NOT NULL DEFAULT 0,last_activity text NOT NULL);
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES nodes(id);
UPDATE chunks c SET district_id=(SELECT id FROM nodes WHERE parent_id=c.world_id AND kind='district' LIMIT 1) WHERE district_id IS NULL;
INSERT INTO schema_versions(version) VALUES(3) ON CONFLICT DO NOTHING;
