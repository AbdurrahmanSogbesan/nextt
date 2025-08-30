/*
  Warnings:

  - The primary key for the `HubMembership` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "public"."HubMembership" DROP CONSTRAINT "HubMembership_pkey",
ALTER COLUMN "hubUserid" SET DATA TYPE TEXT,
ADD CONSTRAINT "HubMembership_pkey" PRIMARY KEY ("hubId", "hubUserid");
