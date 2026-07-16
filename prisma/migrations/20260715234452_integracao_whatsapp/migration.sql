-- CreateTable
CREATE TABLE "IntegracaoWhatsapp" (
    "id" TEXT NOT NULL DEFAULT 'whatsapp',
    "baseUrl" TEXT,
    "token" TEXT,
    "destino" TEXT,
    "destinoNome" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegracaoWhatsapp_pkey" PRIMARY KEY ("id")
);

