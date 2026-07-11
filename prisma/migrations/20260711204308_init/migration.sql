-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SDR', 'CLOSER');

-- CreateEnum
CREATE TYPE "Origem" AS ENUM ('PAGO', 'ORGANICO');

-- CreateEnum
CREATE TYPE "ReuniaoStatus" AS ENUM ('PENDENTE', 'FEITA', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "Resultado" AS ENUM ('EM_ANDAMENTO', 'GANHO', 'PERDIDO');

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criativo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Criativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriativoMensal" (
    "id" TEXT NOT NULL,
    "criativoId" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "investimento" DOUBLE PRECISION NOT NULL,
    "vencedor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CriativoMensal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotivoNaoFechamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MotivoNaoFechamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "origem" "Origem" NOT NULL,
    "criativoId" TEXT,
    "sdrId" TEXT,
    "qualificado" BOOLEAN,
    "agendou" BOOLEAN,
    "reuniaoStatus" "ReuniaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "closerId" TEXT,
    "motivoNaoFechamentoId" TEXT,
    "resultado" "Resultado" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "receita" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestimentoDiario" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InvestimentoDiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricaMensal" (
    "id" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "custoComercial" DOUBLE PRECISION NOT NULL,
    "logosInicio" INTEGER NOT NULL,
    "logosPerdidos" INTEGER NOT NULL,
    "mrrInicio" DOUBLE PRECISION NOT NULL,
    "mrrPerdido" DOUBLE PRECISION NOT NULL,
    "mrrExpansao" DOUBLE PRECISION NOT NULL,
    "clientesAtivos" INTEGER NOT NULL,
    "promotores" INTEGER NOT NULL,
    "neutros" INTEGER NOT NULL,
    "detratores" INTEGER NOT NULL,
    "faturamento" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MetricaMensal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaMensal" (
    "id" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "metaLeads" INTEGER NOT NULL,
    "metaFechamentos" INTEGER NOT NULL,
    "metaReceita" DOUBLE PRECISION NOT NULL,
    "metaCplQualificado" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MetaMensal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CriativoMensal_criativoId_mes_key" ON "CriativoMensal"("criativoId", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "MotivoNaoFechamento_nome_key" ON "MotivoNaoFechamento"("nome");

-- CreateIndex
CREATE INDEX "Lead_data_idx" ON "Lead"("data");

-- CreateIndex
CREATE INDEX "Lead_sdrId_idx" ON "Lead"("sdrId");

-- CreateIndex
CREATE INDEX "Lead_closerId_idx" ON "Lead"("closerId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestimentoDiario_data_key" ON "InvestimentoDiario"("data");

-- CreateIndex
CREATE UNIQUE INDEX "MetricaMensal_mes_key" ON "MetricaMensal"("mes");

-- CreateIndex
CREATE UNIQUE INDEX "MetaMensal_mes_key" ON "MetaMensal"("mes");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "CriativoMensal" ADD CONSTRAINT "CriativoMensal_criativoId_fkey" FOREIGN KEY ("criativoId") REFERENCES "Criativo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_criativoId_fkey" FOREIGN KEY ("criativoId") REFERENCES "Criativo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_sdrId_fkey" FOREIGN KEY ("sdrId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_closerId_fkey" FOREIGN KEY ("closerId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_motivoNaoFechamentoId_fkey" FOREIGN KEY ("motivoNaoFechamentoId") REFERENCES "MotivoNaoFechamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
