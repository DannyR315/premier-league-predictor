-- DropForeignKey
ALTER TABLE "SeasonQuestionResult" DROP CONSTRAINT "SeasonQuestionResult_seasonQuestionId_fkey";

-- AddForeignKey
ALTER TABLE "SeasonQuestionResult" ADD CONSTRAINT "SeasonQuestionResult_seasonQuestionId_fkey" FOREIGN KEY ("seasonQuestionId") REFERENCES "SeasonQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
