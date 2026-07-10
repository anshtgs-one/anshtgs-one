/*
# Add entity_type and entity_id columns to documents table

1. Modified Tables
- `documents` — Added two new nullable columns:
  - `entity_type` (text) — Links a document to an entity type (e.g. 'atl', 'btl', 'campaign', 'event', 'task')
  - `entity_id` (uuid) — Links a document to a specific entity record
2. Security
- No RLS changes needed — existing policies already cover the new columns.
3. Notes
- Both columns are nullable so existing rows are not affected.
- An index is added for efficient lookups by entity.
*/

ALTER TABLE documents ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS entity_id uuid;

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
