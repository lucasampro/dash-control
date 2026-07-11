-- AlterTable
ALTER TABLE "Criativo" ADD COLUMN     "campanha" TEXT,
ADD COLUMN     "conjunto" TEXT,
ADD COLUMN     "metaAdId" TEXT,
ADD COLUMN     "metaAdsetId" TEXT,
ADD COLUMN     "metaCampaignId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Criativo_metaAdId_key" ON "Criativo"("metaAdId");

