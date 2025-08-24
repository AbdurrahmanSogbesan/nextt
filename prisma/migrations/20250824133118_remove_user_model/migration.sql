/*
  Warnings:

  - The primary key for the `RosterMembership` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_NotificationToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Activity" DROP CONSTRAINT "Activity_actorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Hub" DROP CONSTRAINT "Hub_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HubMembership" DROP CONSTRAINT "HubMembership_hubUserid_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invite" DROP CONSTRAINT "Invite_fromId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invite" DROP CONSTRAINT "Invite_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Roster" DROP CONSTRAINT "Roster_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Roster" DROP CONSTRAINT "Roster_currentTurnId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Roster" DROP CONSTRAINT "Roster_nextTurnId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RosterMembership" DROP CONSTRAINT "RosterMembership_rosterUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Turn" DROP CONSTRAINT "Turn_rosterMembershipRosterId_rosterMembershipRosterUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_NotificationToUser" DROP CONSTRAINT "_NotificationToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_NotificationToUser" DROP CONSTRAINT "_NotificationToUser_B_fkey";

-- AlterTable
ALTER TABLE "public"."Activity" ALTER COLUMN "actorId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."Comment" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."Hub" ALTER COLUMN "ownerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."Invite" ALTER COLUMN "fromId" SET DATA TYPE TEXT,
ALTER COLUMN "recipientId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "users" TEXT[];

-- AlterTable
ALTER TABLE "public"."Roster" ALTER COLUMN "createdById" SET DATA TYPE TEXT,
ALTER COLUMN "currentTurnId" SET DATA TYPE TEXT,
ALTER COLUMN "nextTurnId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."RosterMembership" DROP CONSTRAINT "RosterMembership_pkey",
ALTER COLUMN "rosterUserId" SET DATA TYPE TEXT,
ADD CONSTRAINT "RosterMembership_pkey" PRIMARY KEY ("rosterId", "rosterUserId");

-- AlterTable
ALTER TABLE "public"."Turn" ALTER COLUMN "rosterMembershipRosterUserId" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "public"."User";

-- DropTable
DROP TABLE "public"."_NotificationToUser";

-- AddForeignKey
ALTER TABLE "public"."Turn" ADD CONSTRAINT "Turn_rosterMembershipRosterId_rosterMembershipRosterUserId_fkey" FOREIGN KEY ("rosterMembershipRosterId", "rosterMembershipRosterUserId") REFERENCES "public"."RosterMembership"("rosterId", "rosterUserId") ON DELETE SET NULL ON UPDATE CASCADE;
