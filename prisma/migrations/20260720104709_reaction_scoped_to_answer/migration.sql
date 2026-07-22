-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_predictionId_fkey";

-- DropIndex
DROP INDEX "Reaction_predictionId_userId_emoji_key";

-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "predictionId",
ADD COLUMN     "predictionAnswerId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_predictionAnswerId_userId_emoji_key" ON "Reaction"("predictionAnswerId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_predictionAnswerId_fkey" FOREIGN KEY ("predictionAnswerId") REFERENCES "PredictionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

