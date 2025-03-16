-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "foodName" TEXT,
ADD COLUMN     "isFood" BOOLEAN NOT NULL DEFAULT true;
