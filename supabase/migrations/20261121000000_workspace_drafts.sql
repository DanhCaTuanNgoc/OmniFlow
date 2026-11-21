CREATE SCHEMA IF NOT EXISTS omniflow;

CREATE TABLE IF NOT EXISTS omniflow.pipeline_drafts (
  id uuid PRIMARY KEY,
  owner text NOT NULL CHECK (owner ~ '^0x[0-9a-f]{40}$'),
  environment text NOT NULL,
  name text NOT NULL,
  graph_json text NOT NULL,
  updated_at bigint NOT NULL CHECK (updated_at BETWEEN 0 AND 9007199254740991)
);

CREATE INDEX IF NOT EXISTS pipeline_drafts_by_owner
  ON omniflow.pipeline_drafts (owner, environment, updated_at DESC, id);

ALTER TABLE omniflow.pipeline_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON SCHEMA omniflow FROM PUBLIC, anon, authenticated;
REVOKE ALL ON omniflow.pipeline_drafts FROM PUBLIC, anon, authenticated;
