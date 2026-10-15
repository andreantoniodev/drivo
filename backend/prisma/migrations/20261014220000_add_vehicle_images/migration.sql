-- Fotos dos veículos passam a ficar no banco (bytes), servidas pela API.
CREATE TABLE "vehicle_images" (
    "vehicleId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("vehicleId")
);

ALTER TABLE "vehicle_images"
  ADD CONSTRAINT "vehicle_images_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Os caminhos estáticos do seed deixam de existir; o seed reenvia as fotos para o banco.
UPDATE "vehicles" SET "imageUrl" = NULL WHERE "imageUrl" LIKE '/images/seed/vehicles/%';
