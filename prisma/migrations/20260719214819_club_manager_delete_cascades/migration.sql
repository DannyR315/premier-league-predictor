-- DropForeignKey
ALTER TABLE "ClubSeason" DROP CONSTRAINT "ClubSeason_clubId_fkey";

-- AddForeignKey
ALTER TABLE "ClubSeason" ADD CONSTRAINT "ClubSeason_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
