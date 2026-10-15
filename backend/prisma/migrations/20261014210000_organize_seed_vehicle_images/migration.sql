-- As fotos do seed foram movidas para /images/seed/vehicles e convertidas para a extensão real (.jpg).
-- Atualiza os registros existentes para o novo caminho.
UPDATE "vehicles"
SET "imageUrl" = '/images/seed/vehicles/' ||
  regexp_replace(substring("imageUrl" from '^/images/vehicles/(.*)$'), '\.png$', '.jpg')
WHERE "imageUrl" LIKE '/images/vehicles/%';
