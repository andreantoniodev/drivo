-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "category" TEXT;

-- CreateIndex
CREATE INDEX "vehicles_userId_idx" ON "vehicles"("userId");

-- CreateIndex
CREATE INDEX "vehicles_plate_idx" ON "vehicles"("plate");
