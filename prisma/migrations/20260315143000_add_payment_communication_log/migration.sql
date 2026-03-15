-- CreateTable
CREATE TABLE "PaymentCommunicationLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentCommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentCommunicationLog_actorId_createdAt_idx" ON "PaymentCommunicationLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentCommunicationLog_memberId_createdAt_idx" ON "PaymentCommunicationLog"("memberId", "createdAt");

-- AddForeignKey
ALTER TABLE "PaymentCommunicationLog" ADD CONSTRAINT "PaymentCommunicationLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCommunicationLog" ADD CONSTRAINT "PaymentCommunicationLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy payment communication rows from shared moderation audit log
INSERT INTO "PaymentCommunicationLog" (
        "id",
        "actorId",
        "memberId",
        "eventType",
        "reason",
        "status",
        "note",
        "createdAt"
)
SELECT
        legacy."id",
        legacy."actorId",
        legacy."targetId" AS "memberId",
        COALESCE(NULLIF(legacy."metadata"->>'eventType', ''), 'ADMIN_OUTREACH') AS "eventType",
        COALESCE(NULLIF(legacy."metadata"->>'reason', ''), 'N/A') AS "reason",
        COALESCE(NULLIF(legacy."metadata"->>'status', ''), 'PENDING_FOLLOW_UP') AS "status",
        legacy."reason" AS "note",
        legacy."createdAt"
FROM "ModerationAuditLog" legacy
INNER JOIN "User" actor ON actor."id" = legacy."actorId"
INNER JOIN "User" member ON member."id" = legacy."targetId"
WHERE legacy."targetType" = 'PaymentCommunication'
    AND legacy."action" = 'PAYMENT_COMMUNICATION_LOGGED';

DELETE FROM "ModerationAuditLog"
WHERE "targetType" = 'PaymentCommunication'
    AND "action" = 'PAYMENT_COMMUNICATION_LOGGED';
