-- ==============================================================================
-- Migration: Add 'Draft' status to indent_requests table
-- Description:
--   1. Drops existing status check constraint (Pending, Approved, Completed)
--   2. Adds updated check constraint including 'Draft'
--   3. Sets column default to 'Draft'
-- ==============================================================================

BEGIN;

-- 1. Drop existing check constraint on status column
ALTER TABLE indent_requests 
  DROP CONSTRAINT IF EXISTS indent_requests_status_check;

-- 2. Add updated check constraint to allow 'Draft', 'Pending', 'Approved', 'Completed'
ALTER TABLE indent_requests 
  ADD CONSTRAINT indent_requests_status_check 
  CHECK (status IN ('Draft', 'Pending', 'Approved', 'Completed'));

-- 3. Set default value of status column to 'Draft'
ALTER TABLE indent_requests 
  ALTER COLUMN status SET DEFAULT 'Draft';

COMMIT;
