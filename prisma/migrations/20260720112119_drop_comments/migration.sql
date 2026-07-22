-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_predictionId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropTable
DROP TABLE "Comment";

