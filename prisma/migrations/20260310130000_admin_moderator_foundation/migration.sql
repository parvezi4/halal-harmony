-- Add moderator role, moderation permissions config, risk labels, and audit logs.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MODERATOR';

DO $$
BEGIN
  CREATE TYPE "RiskLabel" AS ENUM ('GREEN', 'AMBER', 'RED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS "riskLabel" "RiskLabel" NOT NULL DEFAULT 'GREEN',
  ADD COLUMN IF NOT EXISTS "riskNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "riskLabeledAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "ModeratorPermissionConfig" (
  "id" TEXT NOT NULL,
  "canModerateMessages" BOOLEAN NOT NULL DEFAULT true,
  "canVerifyProfiles" BOOLEAN NOT NULL DEFAULT true,
  "canVerifyPhotos" BOOLEAN NOT NULL DEFAULT true,
  "canInspectSubscriptions" BOOLEAN NOT NULL DEFAULT true,
  "canManageReports" BOOLEAN NOT NULL DEFAULT true,
  "canUpdateRiskLabels" BOOLEAN NOT NULL DEFAULT true,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ModeratorPermissionConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ModerationAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModerationAuditLog_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  ALTER TABLE "ModeratorPermissionConfig"
    ADD CONSTRAINT "ModeratorPermissionConfig_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ModerationAuditLog"
    ADD CONSTRAINT "ModerationAuditLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "ModerationAuditLog_actorId_createdAt_idx"
  ON "ModerationAuditLog"("actorId", "createdAt");

CREATE INDEX IF NOT EXISTS "ModerationAuditLog_targetType_targetId_idx"
  ON "ModerationAuditLog"("targetType", "targetId");
