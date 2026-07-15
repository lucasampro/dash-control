-- CreateTable
CREATE TABLE "IntegracaoMeta" (
    "id" TEXT NOT NULL DEFAULT 'meta',
    "datasetId" TEXT,
    "capiToken" TEXT,
    "sourceName" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegracaoMeta_pkey" PRIMARY KEY ("id")
);

