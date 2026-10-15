-- Garante no banco que cada usuário tenha no máximo um veículo por placa
-- (antes a regra era só uma checagem no service, sujeita a condição de corrida).
-- Se existirem placas duplicadas para o mesmo usuário, resolva-as antes de aplicar esta migration.
DROP INDEX IF EXISTS "vehicles_userId_idx";
DROP INDEX IF EXISTS "vehicles_plate_idx";
CREATE UNIQUE INDEX "vehicles_userId_plate_key" ON "vehicles"("userId", "plate");
