import type { PrismaClient } from '../src/generated/prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const SEED_PHOTOS: Record<string, string> = {
  RTX4B21: 'corolla.jpg',
  QPL8C34: 'hrv.jpg',
  FHD2E09: 'polo.jpg',
  GBN7A55: 'toro.jpg',
  MXR1J78: 'mt03.jpg',
};

type PhotoClient = Pick<PrismaClient, 'vehicle' | 'vehicleImage'>;

export async function ensureVehiclePhotos(
  prisma: PhotoClient,
  userId: string,
  assetsDir = join(process.cwd(), 'prisma', 'seed-assets', 'vehicles'),
  log: (message: string) => void = console.log,
): Promise<string[]> {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId, plate: { in: Object.keys(SEED_PHOTOS) } },
    select: { id: true, plate: true, image: { select: { vehicleId: true } } },
  });

  const created: string[] = [];

  for (const vehicle of vehicles) {
    if (vehicle.image) continue;

    const file = join(assetsDir, SEED_PHOTOS[vehicle.plate]);
    if (!existsSync(file)) {
      log(`⚠️  Foto do seed não encontrada: ${file}`);
      continue;
    }

    const data = readFileSync(file);
    await prisma.vehicleImage.create({
      data: {
        vehicleId: vehicle.id,
        mimeType: 'image/jpeg',
        size: data.length,
        data,
      },
    });
    created.push(vehicle.plate);
    log(
      `🖼️  Foto enviada ao banco: ${vehicle.plate} (${Math.round(data.length / 1024)} KB)`,
    );
  }

  return created;
}
