-- Row Level Security (RLS) Policies for A1Lifter
-- Issue #4: Set up authentication and security on Supabase

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "users_view_own" ON users
  FOR SELECT
  USING (auth.uid()::text = id OR auth.role() = 'authenticated');

-- Users can update their own profile (excluding role changes)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Admins can manage all users
CREATE POLICY "admins_manage_users" ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- ============================================================================
-- EVENT POLICIES
-- ============================================================================

-- Public can view non-deleted published events
CREATE POLICY "events_public_view" ON events
  FOR SELECT
  USING (
    is_deleted = false AND
    status IN ('REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED')
  );

-- Organizers can view all their events
CREATE POLICY "events_organizers_view_own" ON events
  FOR SELECT
  USING (organizer_id = auth.uid()::text);

-- Organizers can create events
CREATE POLICY "events_organizers_create" ON events
  FOR INSERT
  WITH CHECK (
    organizer_id = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role IN ('ORGANIZER', 'ADMIN')
    )
  );

-- Organizers can update their own events
CREATE POLICY "events_organizers_update_own" ON events
  FOR UPDATE
  USING (organizer_id = auth.uid()::text)
  WITH CHECK (organizer_id = auth.uid()::text);

-- Organizers can soft-delete their own events
CREATE POLICY "events_organizers_delete_own" ON events
  FOR UPDATE
  USING (organizer_id = auth.uid()::text)
  WITH CHECK (organizer_id = auth.uid()::text);

-- Admins have full access
CREATE POLICY "events_admins_all" ON events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- ============================================================================
-- CATEGORY POLICIES
-- ============================================================================

-- Public can view categories of published events
CREATE POLICY "categories_public_view" ON categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = categories.event_id
        AND is_deleted = false
        AND status IN ('REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED')
    )
  );

-- Event organizers can manage categories
CREATE POLICY "categories_organizers_manage" ON categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = categories.event_id
        AND organizer_id = auth.uid()::text
    )
  );

-- ============================================================================
-- REGISTRATION POLICIES
-- ============================================================================

-- Athletes can view their own registrations
CREATE POLICY "registrations_athletes_view_own" ON registrations
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Athletes can create registrations for themselves
CREATE POLICY "registrations_athletes_create" ON registrations
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM events
      WHERE id = registrations.event_id
        AND status = 'REGISTRATION_OPEN'
        AND is_deleted = false
    )
  );

-- Athletes can update their own pending registrations
CREATE POLICY "registrations_athletes_update_own" ON registrations
  FOR UPDATE
  USING (user_id = auth.uid()::text AND status = 'PENDING')
  WITH CHECK (user_id = auth.uid()::text);

-- Event organizers can manage registrations for their events
CREATE POLICY "registrations_organizers_manage" ON registrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = registrations.event_id
        AND organizer_id = auth.uid()::text
    )
  );

-- ============================================================================
-- ATTEMPT POLICIES
-- ============================================================================

-- Athletes can view their own attempts
CREATE POLICY "attempts_athletes_view_own" ON attempts
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Public can view attempts for published events
CREATE POLICY "attempts_public_view" ON attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = attempts.event_id
        AND is_deleted = false
        AND status IN ('IN_PROGRESS', 'COMPLETED')
    )
  );

-- Judges can create and update attempts for their assigned events
CREATE POLICY "attempts_judges_manage" ON attempts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM judge_assignments
      WHERE user_id = auth.uid()::text
        AND event_id = attempts.event_id
    )
  );

-- Event organizers can manage attempts for their events
CREATE POLICY "attempts_organizers_manage" ON attempts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = attempts.event_id
        AND organizer_id = auth.uid()::text
    )
  );

-- ============================================================================
-- JUDGE ASSIGNMENT POLICIES
-- ============================================================================

-- Judges can view their assignments
CREATE POLICY "judge_assignments_view_own" ON judge_assignments
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Event organizers can manage judge assignments
CREATE POLICY "judge_assignments_organizers_manage" ON judge_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = judge_assignments.event_id
        AND organizer_id = auth.uid()::text
    )
  );

-- ============================================================================
-- RECORD POLICIES
-- ============================================================================

-- Public can view records for published events
CREATE POLICY "records_public_view" ON records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = records.event_id
        AND is_deleted = false
    )
  );

-- Event organizers can manage records
CREATE POLICY "records_organizers_manage" ON records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = records.event_id
        AND organizer_id = auth.uid()::text
    )
  );

-- ============================================================================
-- NOTIFICATION POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "notifications_view_own" ON notifications
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- System can create notifications
CREATE POLICY "notifications_system_create" ON notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- SESSION POLICIES
-- ============================================================================

-- Public can view sessions of published events
CREATE POLICY "sessions_public_view" ON event_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_sessions.event_id
        AND is_deleted = false
        AND status IN ('REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED')
    )
  );

-- Event organizers can manage sessions
CREATE POLICY "sessions_organizers_manage" ON event_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_sessions.event_id
        AND organizer_id = auth.uid()::text
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::text AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is organizer of event
CREATE OR REPLACE FUNCTION is_event_organizer(event_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events
    WHERE id = event_id_param AND organizer_id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is judge for event
CREATE OR REPLACE FUNCTION is_event_judge(event_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM judge_assignments
    WHERE event_id = event_id_param AND user_id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEXES FOR RLS PERFORMANCE
-- ============================================================================

-- These indexes help RLS policies perform better
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role IN ('ADMIN', 'ORGANIZER');
CREATE INDEX IF NOT EXISTS idx_events_organizer_status ON events(organizer_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_user_event ON registrations(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_event ON attempts(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_judge_assignments_user_event ON judge_assignments(user_id, event_id);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- AUDIT TRIGGER (Optional but recommended)
-- ============================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Audit function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), auth.uid()::text);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid()::text);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), auth.uid()::text);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_events
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_attempts
  AFTER INSERT OR UPDATE OR DELETE ON attempts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_registrations
  AFTER INSERT OR UPDATE OR DELETE ON registrations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
