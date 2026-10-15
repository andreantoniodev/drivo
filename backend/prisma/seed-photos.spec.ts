import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ensureVehiclePhotos, SEED_PHOTOS } from './seed-photos';

describe('ensureVehiclePhotos', () => {
  let dir: string;
  const log = jest.fn();

  const prisma = {
    vehicle: { findMany: jest.fn() },
    vehicleImage: { create: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dir = mkdtempSync(join(tmpdir(), 'seed-photos-'));
    for (const file of Object.values(SEED_PHOTOS))
      writeFileSync(join(dir, file), Buffer.from([1, 2, 3, 4]));
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const run = () => ensureVehiclePhotos(prisma as never, 'user-1', dir, log);

  it('envia ao banco a foto dos veículos demo que ainda não têm imagem', async () => {
    prisma.vehicle.findMany.mockResolvedValue([
      { id: 'v1', plate: 'RTX4B21', image: null },
      { id: 'v2', plate: 'QPL8C34', image: null },
    ]);

    await expect(run()).resolves.toEqual(['RTX4B21', 'QPL8C34']);

    expect(prisma.vehicleImage.create).toHaveBeenCalledTimes(2);
    expect(prisma.vehicleImage.create).toHaveBeenCalledWith({
      data: {
        vehicleId: 'v1',
        mimeType: 'image/jpeg',
        size: 4,
        data: Buffer.from([1, 2, 3, 4]),
      },
    });
  });

  it('é idempotente: não sobrescreve foto que já existe', async () => {
    prisma.vehicle.findMany.mockResolvedValue([
      { id: 'v1', plate: 'RTX4B21', image: { vehicleId: 'v1' } },
    ]);

    await expect(run()).resolves.toEqual([]);
    expect(prisma.vehicleImage.create).not.toHaveBeenCalled();
  });

  it('consulta só os veículos do usuário demo com as placas do seed', async () => {
    prisma.vehicle.findMany.mockResolvedValue([]);

    await run();

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', plate: { in: Object.keys(SEED_PHOTOS) } },
      }),
    );
  });

  it('avisa e segue quando o arquivo da foto não existe', async () => {
    rmSync(join(dir, SEED_PHOTOS.RTX4B21));
    prisma.vehicle.findMany.mockResolvedValue([
      { id: 'v1', plate: 'RTX4B21', image: null },
    ]);

    await expect(run()).resolves.toEqual([]);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Foto do seed não encontrada'),
    );
    expect(prisma.vehicleImage.create).not.toHaveBeenCalled();
  });
});
