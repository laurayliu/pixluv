-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "message" DROP NOT NULL;
