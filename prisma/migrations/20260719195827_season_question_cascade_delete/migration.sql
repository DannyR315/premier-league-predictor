-- DropForeignKey
ALTER TABLE "SeasonQuestion" DROP CONSTRAINT "SeasonQuestion_seasonId_fkey";

-- AddForeignKey
ALTER TABLE "SeasonQuestion" ADD CONSTRAINT "SeasonQuestion_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
