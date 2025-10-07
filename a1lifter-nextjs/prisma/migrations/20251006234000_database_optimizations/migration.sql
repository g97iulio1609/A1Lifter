-- Database optimization indexes for milestone 6

-- Aggregate user lookup by role and status
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "isActive");

-- Improve event filtering by status and start date
CREATE INDEX "events_status_start_date_idx" ON "events"("status", "startDate");

-- Accelerate session ordering within events
CREATE INDEX "event_sessions_event_order_idx" ON "event_sessions"("eventId", "order");

-- Speed up registration review flows
CREATE INDEX "registrations_event_status_idx" ON "registrations"("eventId", "status");
CREATE INDEX "registrations_event_category_idx" ON "registrations"("eventId", "categoryId");

-- Reduce attempt board latency
CREATE INDEX "attempts_event_status_ts_idx" ON "attempts"("eventId", "status", "timestamp");
CREATE INDEX "attempts_event_result_lift_idx" ON "attempts"("eventId", "result", "lift");

-- Faster judge assignment lookups
CREATE INDEX "judge_assignments_event_role_idx" ON "judge_assignments"("eventId", "role");

-- Optimise record browsing
CREATE INDEX "records_event_category_lift_idx" ON "records"("eventId", "categoryId", "lift");

-- Improve notification sort/filter
CREATE INDEX "notifications_user_read_created_idx" ON "notifications"("userId", "isRead", "createdAt");
