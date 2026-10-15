import { formatFileSize, validateCrlvFile } from './crlv-file';

const file = (type: string, size: number) => {
  const f = new File(['x'], 'crlv', { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('validateCrlvFile', () => {
  it('aceita PDF e imagens até 10 MB', () => {
    expect(validateCrlvFile(file('application/pdf', 1024))).toBeNull();
    expect(validateCrlvFile(file('image/png', 10 * 1024 * 1024))).toBeNull();
  });

  it('rejeita formatos não suportados', () => {
    expect(validateCrlvFile(file('text/plain', 10))).toMatch(/Formato não suportado/);
  });

  it('rejeita arquivos acima de 10 MB', () => {
    expect(validateCrlvFile(file('application/pdf', 10 * 1024 * 1024 + 1))).toMatch(/10 MB/);
  });
});

describe('formatFileSize', () => {
  it('formata em KB e MB', () => {
    expect(formatFileSize(212 * 1024)).toBe('212 KB');
    expect(formatFileSize(10)).toBe('1 KB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});
