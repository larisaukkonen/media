-- Neon/Postgres schema for media-admin
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS screens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_screens_user_id ON screens(user_id);

CREATE TABLE IF NOT EXISTS screen_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id    uuid NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  version      integer NOT NULL DEFAULT 1,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  title        text,
  layout_json  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_screen_versions_screen_version
  ON screen_versions(screen_id, version);

CREATE INDEX IF NOT EXISTS idx_screen_versions_screen_id ON screen_versions(screen_id);

CREATE TABLE IF NOT EXISTS monitors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  device_token  text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitors_user_id ON monitors(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_monitors_device_token ON monitors(device_token);

CREATE TABLE IF NOT EXISTS monitor_screen_publish (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id        uuid NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  screen_version_id uuid NOT NULL REFERENCES screen_versions(id) ON DELETE CASCADE,
  is_active         boolean NOT NULL DEFAULT true,
  published_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_msp_monitor_id ON monitor_screen_publish(monitor_id);
CREATE INDEX IF NOT EXISTS idx_msp_screen_version_id ON monitor_screen_publish(screen_version_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_msp_one_active_per_monitor
  ON monitor_screen_publish(monitor_id)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS media_assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  file_url     text NOT NULL,
  file_name    text NOT NULL,
  file_size    bigint NOT NULL CHECK (file_size >= 0),
  type         text NOT NULL CHECK (type IN ('image', 'video')),
  mime_type    text NOT NULL,
  duration_ms  integer,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);

CREATE TABLE IF NOT EXISTS scenes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scenes_user_id ON scenes(user_id);

CREATE TABLE IF NOT EXISTS scene_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id     uuid NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  version      integer NOT NULL DEFAULT 1,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  data_json    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_scene_versions_scene_version
  ON scene_versions(scene_id, version);

CREATE INDEX IF NOT EXISTS idx_scene_versions_scene_id ON scene_versions(scene_id);

CREATE TABLE IF NOT EXISTS screen_version_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_version_id uuid NOT NULL REFERENCES screen_versions(id) ON DELETE CASCADE,
  scene_version_id  uuid NOT NULL REFERENCES scene_versions(id) ON DELETE RESTRICT,
  sort_order        integer NOT NULL DEFAULT 0,
  duration_ms       integer,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_svi_screen_version_id ON screen_version_items(screen_version_id);
CREATE INDEX IF NOT EXISTS idx_svi_scene_version_id ON screen_version_items(scene_version_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_svi_screen_order
  ON screen_version_items(screen_version_id, sort_order);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_screens_updated_at ON screens;
CREATE TRIGGER trg_screens_updated_at
BEFORE UPDATE ON screens
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_monitors_updated_at ON monitors;
CREATE TRIGGER trg_monitors_updated_at
BEFORE UPDATE ON monitors
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_scenes_updated_at ON scenes;
CREATE TRIGGER trg_scenes_updated_at
BEFORE UPDATE ON scenes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
