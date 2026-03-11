-- Persist moderator warnings when rejecting flagged messages.
CREATE TABLE "ModerationWarning" (
  "id" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "issuerId" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ModerationWarning_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ModerationWarning_recipientId_createdAt_idx"
  ON "ModerationWarning"("recipientId", "createdAt");

CREATE INDEX "ModerationWarning_issuerId_createdAt_idx"
  ON "ModerationWarning"("issuerId", "createdAt");

CREATE INDEX "ModerationWarning_messageId_idx"
  ON "ModerationWarning"("messageId");

ALTER TABLE "ModerationWarning"
  ADD CONSTRAINT "ModerationWarning_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ModerationWarning"
  ADD CONSTRAINT "ModerationWarning_issuerId_fkey"
  FOREIGN KEY ("issuerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ModerationWarning"
  ADD CONSTRAINT "ModerationWarning_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
