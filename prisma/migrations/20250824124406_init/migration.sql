-- CreateEnum
CREATE TYPE "public"."VISIBILITY_CHOICE" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "public"."ROTATION_CHOICE" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ANNUALLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ROTATION_TYPE" AS ENUM ('DAILY', 'WEEKLY', 'ANNUALLY');

-- CreateEnum
CREATE TYPE "public"."STATUS_CHOICE" AS ENUM ('ONGOING', 'PENDING', 'COMPLETE');

-- CreateEnum
CREATE TYPE "public"."TURN_STATUS_CHOICE" AS ENUM ('PENDING', 'DONE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "clerkUid" TEXT NOT NULL,
    "phone" VARCHAR(50) NOT NULL DEFAULT '',
    "dob" TIMESTAMP(3),
    "avatar" VARCHAR(400),
    "nickname" TEXT NOT NULL DEFAULT '',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Hub" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "logo" VARCHAR(400),
    "theme" VARCHAR(50),
    "visibility" "public"."VISIBILITY_CHOICE" NOT NULL DEFAULT 'PUBLIC',
    "description" TEXT DEFAULT '',
    "ownerId" INTEGER,
    "slug" VARCHAR(256) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Hub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HubMembership" (
    "uuid" TEXT NOT NULL,
    "hubUserid" INTEGER NOT NULL,
    "hubId" INTEGER NOT NULL,
    "dateJoined" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateLeft" TIMESTAMPTZ(3),

    CONSTRAINT "HubMembership_pkey" PRIMARY KEY ("hubId","hubUserid")
);

-- CreateTable
CREATE TABLE "public"."Roster" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "description" TEXT DEFAULT '',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "enablePushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "start" TIMESTAMPTZ(3) NOT NULL,
    "end" TIMESTAMPTZ(3) NOT NULL,
    "rotationType" "public"."ROTATION_CHOICE",
    "hubId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "currentTurnId" INTEGER,
    "nextTurnId" INTEGER,
    "nextDate" TIMESTAMPTZ(3),
    "status" "public"."STATUS_CHOICE" NOT NULL DEFAULT 'PENDING',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Roster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RosterMembership" (
    "uuid" TEXT NOT NULL,
    "rosterUserId" INTEGER NOT NULL,
    "rosterId" INTEGER NOT NULL,
    "dateJoined" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" INTEGER NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RosterMembership_pkey" PRIMARY KEY ("rosterId","rosterUserId")
);

-- CreateTable
CREATE TABLE "public"."Activity" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,
    "actorId" INTEGER,
    "body" TEXT DEFAULT '',
    "hubId" INTEGER,
    "rosterId" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "userId" INTEGER,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rosterId" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "body" TEXT DEFAULT '',
    "email" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rosterId" INTEGER,
    "hubId" INTEGER,
    "inviteId" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "turnId" INTEGER,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Turn" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "status" "public"."TURN_STATUS_CHOICE" NOT NULL DEFAULT 'PENDING',
    "rosterId" INTEGER,
    "dueDate" TIMESTAMPTZ(3),
    "event" JSONB,
    "rosterMembershipRosterId" INTEGER,
    "rosterMembershipRosterUserId" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Turn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invite" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."STATUS_CHOICE" NOT NULL DEFAULT 'PENDING',
    "fromId" INTEGER,
    "recipientId" INTEGER,
    "email" TEXT NOT NULL,
    "hubId" INTEGER,
    "rosterId" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RotationOption" (
    "id" SERIAL NOT NULL,
    "rosterId" INTEGER NOT NULL,
    "rotation" "public"."ROTATION_TYPE" NOT NULL,
    "unit" INTEGER NOT NULL,

    CONSTRAINT "RotationOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_NotificationToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_NotificationToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_uuid_key" ON "public"."User"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUid_key" ON "public"."User"("clerkUid");

-- CreateIndex
CREATE UNIQUE INDEX "Hub_uuid_key" ON "public"."Hub"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Hub_slug_key" ON "public"."Hub"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HubMembership_uuid_key" ON "public"."HubMembership"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Roster_uuid_key" ON "public"."Roster"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "RosterMembership_uuid_key" ON "public"."RosterMembership"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_uuid_key" ON "public"."Comment"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_uuid_key" ON "public"."Notification"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_inviteId_key" ON "public"."Notification"("inviteId");

-- CreateIndex
CREATE UNIQUE INDEX "Turn_uuid_key" ON "public"."Turn"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_uuid_key" ON "public"."Invite"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "RotationOption_rosterId_key" ON "public"."RotationOption"("rosterId");

-- CreateIndex
CREATE INDEX "_NotificationToUser_B_index" ON "public"."_NotificationToUser"("B");

-- AddForeignKey
ALTER TABLE "public"."Hub" ADD CONSTRAINT "Hub_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HubMembership" ADD CONSTRAINT "HubMembership_hubUserid_fkey" FOREIGN KEY ("hubUserid") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HubMembership" ADD CONSTRAINT "HubMembership_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "public"."Hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Roster" ADD CONSTRAINT "Roster_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "public"."Hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Roster" ADD CONSTRAINT "Roster_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Roster" ADD CONSTRAINT "Roster_currentTurnId_fkey" FOREIGN KEY ("currentTurnId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Roster" ADD CONSTRAINT "Roster_nextTurnId_fkey" FOREIGN KEY ("nextTurnId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RosterMembership" ADD CONSTRAINT "RosterMembership_rosterUserId_fkey" FOREIGN KEY ("rosterUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RosterMembership" ADD CONSTRAINT "RosterMembership_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "public"."Roster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "public"."Hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "public"."Roster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "public"."Roster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "public"."Roster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "public"."Hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "public"."Invite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "public"."Turn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Turn" ADD CONSTRAINT "Turn_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "public"."Roster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Turn" ADD CONSTRAINT "Turn_rosterMembershipRosterId_rosterMembershipRosterUserId_fkey" FOREIGN KEY ("rosterMembershipRosterId", "rosterMembershipRosterUserId") REFERENCES "public"."RosterMembership"("rosterId", "rosterUserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "public"."Hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "public"."Roster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RotationOption" ADD CONSTRAINT "RotationOption_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "public"."Roster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_NotificationToUser" ADD CONSTRAINT "_NotificationToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_NotificationToUser" ADD CONSTRAINT "_NotificationToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
