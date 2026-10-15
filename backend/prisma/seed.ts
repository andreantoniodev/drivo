import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { ensureVehiclePhotos } from './seed-photos';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  if (process.env.SEED_DEMO === 'false') {
    console.log('⏭️  SEED_DEMO=false: dados de demonstração não serão criados.');
    return;
  }

  console.log('🌱 Iniciando seed do banco de dados Drivo...');

  const hashedPassword = await bcrypt.hash('Drivo@2026', 10);
  const user = await prisma.user.upsert({
    where: { email: 'mariana.costa@email.com' },
    update: {},
    create: {
      name: 'Mariana Costa',
      email: 'mariana.costa@email.com',
      password: hashedPassword,
    },
  });

  console.log(`👤 Usuário demo: ${user.name} (${user.email})`);

  const existingVehicles = await prisma.vehicle.count({
    where: { userId: user.id },
  });
  if (existingVehicles > 0) {
    console.log(
      `⏭️  Garagem demo já possui ${existingVehicles} veículo(s). Veículos mantidos.`,
    );
    await ensureVehiclePhotos(prisma, user.id);
    return;
  }

  const vehicles = [
    {
      userId: user.id,
      brand: 'TOYOTA',
      model: 'Corolla Altis Hybrid',
      plate: 'RTX4B21',
      renavam: '01234567890',
      chassi: '9BRBL3HE8P0124821',
      yearFabrication: 2022,
      yearModel: 2023,
      color: 'Prata',
      fuelType: 'Híbrido',
      category: 'Passageiro',
      mileage: 18000,
    },
    {
      userId: user.id,
      brand: 'HONDA',
      model: 'HR-V EXL Turbo',
      plate: 'QPL8C34',
      renavam: '13579246801',
      chassi: '93HGH2860PZ010193',
      yearFabrication: 2023,
      yearModel: 2024,
      color: 'Preto',
      fuelType: 'Flex',
      category: 'Passageiro',
      mileage: 8500,
    },
    {
      userId: user.id,
      brand: 'VOLKSWAGEN',
      model: 'Polo Highline TSI',
      plate: 'FHD2E09',
      renavam: '11223344556',
      chassi: '9BWCA2BZ0MP007740',
      yearFabrication: 2021,
      yearModel: 2022,
      color: 'Branco',
      fuelType: 'Flex',
      category: 'Passageiro',
      mileage: 32000,
    },
    {
      userId: user.id,
      brand: 'FIAT',
      model: 'Toro Volcano Diesel',
      plate: 'GBN7A55',
      renavam: '98765432109',
      chassi: '988226071NP033312',
      yearFabrication: 2022,
      yearModel: 2022,
      color: 'Cinza',
      fuelType: 'Diesel',
      category: 'Carga',
      mileage: 41000,
    },
    {
      userId: user.id,
      brand: 'YAMAHA',
      model: 'MT-03 ABS',
      plate: 'MXR1J78',
      renavam: '55667788990',
      chassi: '9C6RG2340M0005521',
      yearFabrication: 2020,
      yearModel: 2021,
      color: 'Azul',
      fuelType: 'Gasolina',
      category: 'Motocicleta',
      mileage: 12000,
    },
  ];

  for (const vehicleData of vehicles) {
    const isToyota = vehicleData.brand === 'TOYOTA';
    const created = await prisma.vehicle.create({
      data: {
        ...vehicleData,
        ...(isToyota
          ? {
              crlv: {
                create: {
                  fileName: 'CRLV_Digital_Corolla_2023.pdf',
                  fileType: 'application/pdf',
                  fileSize: 245800,
                  numeroCrLV: '01293847561',
                  codigoSeguranca: '984712039',
                  exercicio: 2023,
                  dataEmissao: new Date('2023-04-15T10:30:00Z'),
                  nomeProprietario: 'Mariana Costa',
                  cpfCnpjProprietario: '***.482.918-**',
                  localRegistro: 'São Paulo / SP',
                  rawAiExtraction: {
                    confidence: 0.98,
                    modelUsed: 'gemini-3.8-flash',
                    extractedFields: [
                      'plate',
                      'renavam',
                      'chassi',
                      'brand',
                      'model',
                      'yearFabrication',
                      'yearModel',
                      'color',
                      'fuelType',
                    ],
                  },
                },
              },
            }
          : {}),
      },
      include: {
        crlv: true,
      },
    });
    console.log(
      `🚗 Veículo criado: ${created.brand} ${created.model} [${created.plate}] ${
        created.crlv ? '(com CRLV anexado)' : ''
      }`,
    );
  }

  await ensureVehiclePhotos(prisma, user.id);

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
