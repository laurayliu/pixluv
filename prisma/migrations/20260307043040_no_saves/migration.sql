/*
  Warnings:

  - You are about to drop the `Save` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Save" DROP CONSTRAINT "Save_postId_fkey";

-- DropForeignKey
ALTER TABLE "Save" DROP CONSTRAINT "Save_userId_fkey";

-- DropTable
DROP TABLE "Save";
