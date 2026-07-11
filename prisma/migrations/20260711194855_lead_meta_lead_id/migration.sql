-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "metaLeadId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lead_metaLeadId_key" ON "Lead"("metaLeadId");
