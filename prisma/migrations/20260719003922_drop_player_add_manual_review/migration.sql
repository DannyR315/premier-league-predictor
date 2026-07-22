-- AlterEnum
ALTER TYPE "ScoringStrategy" ADD VALUE 'MANUAL_REVIEW';

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_currentClubId_fkey";

-- DropForeignKey
ALTER TABLE "PredictionAnswer" DROP CONSTRAINT "PredictionAnswer_playerId_fkey";

-- DropForeignKey
ALTER TABLE "SeasonQuestionResult" DROP CONSTRAINT "SeasonQuestionResult_playerId_fkey";

-- AlterTable
ALTER TABLE "PredictionAnswer" DROP COLUMN "playerId";

-- AlterTable
ALTER TABLE "SeasonQuestionResult" DROP COLUMN "playerId";

-- DropTable
DROP TABLE "Player";

