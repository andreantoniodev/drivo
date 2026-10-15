export const CRLV_ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];
export const CRLV_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export function validateCrlvFile(file: File): string | null {
  if (!CRLV_ACCEPTED_TYPES.includes(file.type))
    return 'Formato não suportado. Envie PDF ou imagem.';
  if (file.size > CRLV_MAX_SIZE_BYTES) return 'Arquivo excede o limite de 10 MB.';
  return null;
}

export function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
