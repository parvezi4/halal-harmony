-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPERADMIN';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "flaggedReason" TEXT,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "ModeratorPermissionConfig" ADD COLUMN     "canManageMembers" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AdminAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "favoriteUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewedProfileId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminAccount_userId_key" ON "AdminAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAccount_email_key" ON "AdminAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MemberAccount_userId_key" ON "MemberAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberAccount_email_key" ON "MemberAccount"("email");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_favoriteUserId_idx" ON "Favorite"("favoriteUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_favoriteUserId_key" ON "Favorite"("userId", "favoriteUserId");

-- CreateIndex
CREATE INDEX "ProfileView_viewerId_viewedAt_idx" ON "ProfileView"("viewerId", "viewedAt");

-- CreateIndex
CREATE INDEX "ProfileView_viewedProfileId_idx" ON "ProfileView"("viewedProfileId");

-- CreateIndex
CREATE INDEX "Message_moderationStatus_idx" ON "Message"("moderationStatus");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminAccount" ADD CONSTRAINT "AdminAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberAccount" ADD CONSTRAINT "MemberAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_favoriteUserId_fkey" FOREIGN KEY ("favoriteUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewedProfileId_fkey" FOREIGN KEY ("viewedProfileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
