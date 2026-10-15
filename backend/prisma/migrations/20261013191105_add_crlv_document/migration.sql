-- CreateTable
CREATE TABLE "crlv_documents" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "fileUrl" TEXT,
    "numeroCrLV" TEXT,
    "codigoSeguranca" TEXT,
    "exercicio" INTEGER,
    "dataEmissao" TIMESTAMP(3),
    "nomeProprietario" TEXT,
    "cpfCnpjProprietario" TEXT,
    "localRegistro" TEXT,
    "rawAiExtraction" JSONB,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crlv_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crlv_documents_vehicleId_key" ON "crlv_documents"("vehicleId");

-- AddForeignKey
ALTER TABLE "crlv_documents" ADD CONSTRAINT "crlv_documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
