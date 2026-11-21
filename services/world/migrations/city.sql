CREATE TABLE IF NOT EXISTS city_guests(
 token text PRIMARY KEY, id uuid UNIQUE NOT NULL, avatar jsonb NOT NULL,
 life jsonb NOT NULL, pose jsonb, online boolean NOT NULL DEFAULT true,
 seen timestamptz NOT NULL DEFAULT now(), last_request uuid, last_reply jsonb
);
CREATE INDEX IF NOT EXISTS city_presence ON city_guests(seen) WHERE online;
CREATE TABLE IF NOT EXISTS city_joins(bucket text PRIMARY KEY,n integer NOT NULL,created timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS city_commons(id integer PRIMARY KEY,deliveries integer NOT NULL DEFAULT 0);
INSERT INTO city_commons(id) VALUES(1) ON CONFLICT DO NOTHING;
