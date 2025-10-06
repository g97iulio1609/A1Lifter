-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'ORGANIZER', 'JUDGE', 'ATHLETE', 'USER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."Sport" AS ENUM ('POWERLIFTING', 'WEIGHTLIFTING', 'STRONGMAN', 'CROSSFIT', 'STREETLIFTING');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('PLANNED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'MIXED', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WAITLIST');

-- CreateEnum
CREATE TYPE "public"."LiftType" AS ENUM ('SQUAT', 'BENCH', 'DEADLIFT', 'SNATCH', 'CLEAN_AND_JERK', 'OVERHEAD_PRESS', 'ATLAS_STONES', 'LOG_PRESS', 'TIRE_FLIP', 'THRUSTER', 'PULL_UP', 'BOX_JUMP');

-- CreateEnum
CREATE TYPE "public"."AttemptResult" AS ENUM ('PENDING', 'GOOD', 'NO_LIFT', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "public"."JudgeRole" AS ENUM ('HEAD_JUDGE', 'SIDE_JUDGE', 'TECHNICAL_JUDGE');

-- CreateEnum
CREATE TYPE "public"."RecordType" AS ENUM ('EVENT_RECORD', 'COMPETITION_RECORD', 'PERSONAL_RECORD');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('REGISTRATION_APPROVED', 'REGISTRATION_REJECTED', 'ATTEMPT_UPCOMING', 'RESULT_POSTED', 'EVENT_UPDATE', 'SYSTEM_ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'ATHLETE',
    "emailVerified" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sport" "public"."Sport" NOT NULL,
    "status" "public"."EventStatus" NOT NULL DEFAULT 'PLANNED',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "maxAthletes" INTEGER,
    "organizerId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "minWeight" DOUBLE PRECISION,
    "maxWeight" DOUBLE PRECISION,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "eventId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."registrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "status" "public"."RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "bodyWeight" DOUBLE PRECISION,
    "lot" INTEGER,
    "platform" TEXT,
    "notes" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "lift" "public"."LiftType" NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "result" "public"."AttemptResult" NOT NULL DEFAULT 'PENDING',
    "judgeScores" JSONB,
    "videoUrl" TEXT,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."judge_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "role" "public"."JudgeRole" NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "judge_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."records" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "lift" "public"."LiftType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "recordType" "public"."RecordType" NOT NULL,
    "previousRecord" DOUBLE PRECISION,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "public"."users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON "public"."user_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_token_key" ON "public"."verificationtokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "public"."verificationtokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "events_organizerId_idx" ON "public"."events"("organizerId");

-- CreateIndex
CREATE INDEX "events_sport_idx" ON "public"."events"("sport");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "public"."events"("status");

-- CreateIndex
CREATE INDEX "events_startDate_idx" ON "public"."events"("startDate");

-- CreateIndex
CREATE INDEX "events_isDeleted_idx" ON "public"."events"("isDeleted");

-- CreateIndex
CREATE INDEX "event_sessions_eventId_idx" ON "public"."event_sessions"("eventId");

-- CreateIndex
CREATE INDEX "event_sessions_startTime_idx" ON "public"."event_sessions"("startTime");

-- CreateIndex
CREATE INDEX "categories_eventId_idx" ON "public"."categories"("eventId");

-- CreateIndex
CREATE INDEX "categories_gender_idx" ON "public"."categories"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "categories_eventId_name_key" ON "public"."categories"("eventId", "name");

-- CreateIndex
CREATE INDEX "registrations_userId_idx" ON "public"."registrations"("userId");

-- CreateIndex
CREATE INDEX "registrations_eventId_idx" ON "public"."registrations"("eventId");

-- CreateIndex
CREATE INDEX "registrations_categoryId_idx" ON "public"."registrations"("categoryId");

-- CreateIndex
CREATE INDEX "registrations_status_idx" ON "public"."registrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_userId_eventId_key" ON "public"."registrations"("userId", "eventId");

-- CreateIndex
CREATE INDEX "attempts_userId_idx" ON "public"."attempts"("userId");

-- CreateIndex
CREATE INDEX "attempts_eventId_idx" ON "public"."attempts"("eventId");

-- CreateIndex
CREATE INDEX "attempts_categoryId_idx" ON "public"."attempts"("categoryId");

-- CreateIndex
CREATE INDEX "attempts_registrationId_idx" ON "public"."attempts"("registrationId");

-- CreateIndex
CREATE INDEX "attempts_result_idx" ON "public"."attempts"("result");

-- CreateIndex
CREATE INDEX "attempts_timestamp_idx" ON "public"."attempts"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "attempts_userId_eventId_lift_attemptNumber_key" ON "public"."attempts"("userId", "eventId", "lift", "attemptNumber");

-- CreateIndex
CREATE INDEX "judge_assignments_userId_idx" ON "public"."judge_assignments"("userId");

-- CreateIndex
CREATE INDEX "judge_assignments_eventId_idx" ON "public"."judge_assignments"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "judge_assignments_userId_eventId_key" ON "public"."judge_assignments"("userId", "eventId");

-- CreateIndex
CREATE INDEX "records_eventId_idx" ON "public"."records"("eventId");

-- CreateIndex
CREATE INDEX "records_categoryId_idx" ON "public"."records"("categoryId");

-- CreateIndex
CREATE INDEX "records_lift_idx" ON "public"."records"("lift");

-- CreateIndex
CREATE INDEX "records_recordType_idx" ON "public"."records"("recordType");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "public"."notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "public"."notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "public"."notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_sessions" ADD CONSTRAINT "event_sessions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registrations" ADD CONSTRAINT "registrations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registrations" ADD CONSTRAINT "registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registrations" ADD CONSTRAINT "registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attempts" ADD CONSTRAINT "attempts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attempts" ADD CONSTRAINT "attempts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attempts" ADD CONSTRAINT "attempts_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attempts" ADD CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."judge_assignments" ADD CONSTRAINT "judge_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."records" ADD CONSTRAINT "records_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."records" ADD CONSTRAINT "records_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

