/*
# Create comments table for enterprise collaboration

1. New Tables
- `comments` — Stores comments on any entity (ATL, BTL, Campaign, Event, Task, Creative, Vendor, Travel, etc.)
  - `id` (uuid, primary key)
  - `entity_type` (text, not null) — e.g. 'atl', 'btl', 'campaign', 'event', 'task', 'creative', 'vendor', 'travel'
  - `entity_id` (uuid, not null) — FK to the entity record
  - `user_id` (uuid, not null) — FK to auth.users, defaults to auth.uid()
  - `user_name` (text) — denormalized for display
  - `user_email` (text) — denormalized for display
  - `user_avatar_url` (text) — denormalized for display
  - `content` (text, not null) — the comment text
  - `parent_id` (uuid) — for replies (null = top-level comment)
  - `mentions` (text[]) — array of user IDs mentioned
  - `attachments` (jsonb) — file metadata
  - `reactions` (jsonb) — emoji reactions { "👍": ["user1", "user2"], "❤️": ["user3"] }
  - `is_pinned` (boolean, default false) — pinned comments
  - `is_read` (boolean, default false) — read status
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `comments`.
- Authenticated users can read all comments (shared collaboration).
- Authenticated users can insert their own comments.
- Authenticated users can update their own comments.
- Authenticated users can delete their own comments.
- Super admin can delete any comment (checked via profiles table).
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text,
  user_email text,
  user_avatar_url text,
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  mentions text[] DEFAULT '{}',
  attachments jsonb DEFAULT '[]'::jsonb,
  reactions jsonb DEFAULT '{}'::jsonb,
  is_pinned boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_comments" ON comments;
CREATE POLICY "select_comments" ON comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_comments" ON comments;
CREATE POLICY "insert_own_comments" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_comments" ON comments;
CREATE POLICY "update_own_comments" ON comments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_comments" ON comments;
CREATE POLICY "delete_own_comments" ON comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
  ));
