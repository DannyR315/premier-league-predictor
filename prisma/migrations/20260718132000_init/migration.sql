-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PLAYER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('DRAFT', 'OPEN', 'LOCKED', 'ENDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AnswerType" AS ENUM ('TEAM', 'PLAYER', 'MANAGER', 'LEAGUE_POSITION', 'MULTIPLE_TEAMS', 'NUMBER', 'TEXT');

-- CreateEnum
CREATE TYPE "ScoringStrategy" AS ENUM ('EXACT_MATCH', 'POSITION_DIFFERENCE', 'MULTI_SELECT', 'COMMUNITY_VOTE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "SeasonStatus" NOT NULL DEFAULT 'DRAFT',
    "predictionsLockAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "crestUrl" TEXT,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubSeason" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,

    CONSTRAINT "ClubSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nationality" TEXT,
    "currentClubId" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manager" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nationality" TEXT,
    "currentClubId" TEXT,

    CONSTRAINT "Manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionDefinition" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "description" TEXT,
    "answerType" "AnswerType" NOT NULL,
    "scoringStrategy" "ScoringStrategy" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonQuestion" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "questionDefinitionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "points" INTEGER NOT NULL,
    "votingClosedAt" TIMESTAMP(3),
    "resultFinalizedAt" TIMESTAMP(3),

    CONSTRAINT "SeasonQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionAnswer" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "seasonQuestionId" TEXT NOT NULL,
    "clubId" TEXT,
    "playerId" TEXT,
    "managerId" TEXT,
    "numberValue" INTEGER,
    "textValue" TEXT,

    CONSTRAINT "PredictionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionAnswerClub" (
    "id" TEXT NOT NULL,
    "predictionAnswerId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "PredictionAnswerClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonQuestionResult" (
    "id" TEXT NOT NULL,
    "seasonQuestionId" TEXT NOT NULL,
    "clubId" TEXT,
    "playerId" TEXT,
    "managerId" TEXT,
    "numberValue" INTEGER,
    "textValue" TEXT,
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedByUserId" TEXT NOT NULL,

    CONSTRAINT "SeasonQuestionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonQuestionResultClub" (
    "id" TEXT NOT NULL,
    "seasonQuestionResultId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "SeasonQuestionResultClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityRating" (
    "id" TEXT NOT NULL,
    "predictionAnswerId" TEXT NOT NULL,
    "voterUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringResult" (
    "id" TEXT NOT NULL,
    "predictionAnswerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoringResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Season_competitionId_label_key" ON "Season"("competitionId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "ClubSeason_clubId_seasonId_key" ON "ClubSeason"("clubId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonQuestion_seasonId_questionDefinitionId_key" ON "SeasonQuestion"("seasonId", "questionDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_seasonId_userId_key" ON "Prediction"("seasonId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionAnswer_predictionId_seasonQuestionId_key" ON "PredictionAnswer"("predictionId", "seasonQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionAnswerClub_predictionAnswerId_clubId_key" ON "PredictionAnswerClub"("predictionAnswerId", "clubId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonQuestionResult_seasonQuestionId_key" ON "SeasonQuestionResult"("seasonQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonQuestionResultClub_seasonQuestionResultId_clubId_key" ON "SeasonQuestionResultClub"("seasonQuestionResultId", "clubId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityRating_predictionAnswerId_voterUserId_key" ON "CommunityRating"("predictionAnswerId", "voterUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringResult_predictionAnswerId_key" ON "ScoringResult"("predictionAnswerId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_predictionId_userId_emoji_key" ON "Reaction"("predictionId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubSeason" ADD CONSTRAINT "ClubSeason_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubSeason" ADD CONSTRAINT "ClubSeason_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_currentClubId_fkey" FOREIGN KEY ("currentClubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manager" ADD CONSTRAINT "Manager_currentClubId_fkey" FOREIGN KEY ("currentClubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonQuestion" ADD CONSTRAINT "SeasonQuestion_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonQuestion" ADD CONSTRAINT "SeasonQuestion_questionDefinitionId_fkey" FOREIGN KEY ("questionDefinitionId") REFERENCES "QuestionDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionAnswer" ADD CONSTRAINT "PredictionAnswer_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionAnswer" ADD CONSTRAINT "PredictionAnswer_seasonQuestionId_fkey" FOREIGN KEY ("seasonQuestionId") REFERENCES "SeasonQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionAnswer" ADD CONSTRAINT "PredictionAnswer_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionAnswer" ADD CONSTRAINT "PredictionAnswer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionAnswer" ADD CONSTRAINT "PredictionAnswer_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionAnswerClub" ADD CONSTRAINT "PredictionAnswerClub_predictionAnswerId_fkey" FOREIGN KEY ("predictionAnswerId") REFERENCES "PredictionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionAnswerClub" ADD CONSTRAINT "PredictionAnswerClub_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonQuestionResult" ADD CONSTRAINT "SeasonQuestionResult_seasonQuestionId_fkey" FOREIGN KEY ("seasonQuestionId") REFERENCES "SeasonQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonQuestionResult" ADD CONSTRAINT "SeasonQuestionResult_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonQuestionResult" ADD CONSTRAINT "SeasonQuestionResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonQuestionResult" ADD CONSTRAINT "SeasonQuestionResult_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonQuestionResult" ADD CONSTRAINT "SeasonQuestionResult_finalizedByUserId_fkey" FOREIGN KEY ("finalizedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonQuestionResultClub" ADD CONSTRAINT "SeasonQuestionResultClub_seasonQuestionResultId_fkey" FOREIGN KEY ("seasonQuestionResultId") REFERENCES "SeasonQuestionResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonQuestionResultClub" ADD CONSTRAINT "SeasonQuestionResultClub_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityRating" ADD CONSTRAINT "CommunityRating_predictionAnswerId_fkey" FOREIGN KEY ("predictionAnswerId") REFERENCES "PredictionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityRating" ADD CONSTRAINT "CommunityRating_voterUserId_fkey" FOREIGN KEY ("voterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringResult" ADD CONSTRAINT "ScoringResult_predictionAnswerId_fkey" FOREIGN KEY ("predictionAnswerId") REFERENCES "PredictionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
