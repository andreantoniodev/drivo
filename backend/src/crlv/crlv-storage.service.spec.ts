import * as fs from 'fs';
import * as path from 'path';
import { CrlvStorageService } from './crlv-storage.service';

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
  };
});

const mocked = fs as jest.Mocked<typeof fs>;

const file = (overrides: Partial<Express.Multer.File> = {}) =>
  ({
    buffer: Buffer.from('%PDF-1.4 teste'),
    mimetype: 'application/pdf',
    originalname: 'meu_crlv.pdf',
    size: 14,
    ...overrides,
  }) as Express.Multer.File;

describe('CrlvStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.existsSync.mockReturnValue(true);
  });

  it('cria a pasta de uploads na inicialização quando ela não existe', () => {
    mocked.existsSync.mockReturnValue(false);

    new CrlvStorageService();

    expect(mocked.mkdirSync).toHaveBeenCalledWith(
      path.resolve(process.cwd(), 'uploads', 'crlv'),
      { recursive: true },
    );
  });

  it('grava o arquivo com nome aleatório (não usa o nome enviado) e preserva a extensão', () => {
    const service = new CrlvStorageService();

    const stored = service.save(
      file({ originalname: '../../etc/passwd.PNG', mimetype: 'image/png' }),
    );

    expect(stored.fileName).toBe('../../etc/passwd.PNG');
    expect(path.dirname(stored.filePath)).toBe(
      path.resolve(process.cwd(), 'uploads', 'crlv'),
    );
    expect(path.basename(stored.filePath)).toMatch(/^[0-9a-f-]{36}\.PNG$/);
    expect(mocked.writeFileSync).toHaveBeenCalledWith(
      stored.filePath,
      expect.any(Buffer),
    );
  });

  it('usa .pdf quando o arquivo enviado não tem extensão', () => {
    const service = new CrlvStorageService();

    expect(service.save(file({ originalname: 'crlv' })).filePath).toMatch(
      /\.pdf$/,
    );
  });

  describe('exists', () => {
    it('é falso para caminho vazio e consulta o disco nos demais casos', () => {
      const service = new CrlvStorageService();
      mocked.existsSync.mockClear();

      expect(service.exists(null)).toBe(false);
      expect(service.exists('')).toBe(false);
      expect(mocked.existsSync).not.toHaveBeenCalled();

      mocked.existsSync.mockReturnValue(true);
      expect(service.exists('/uploads/crlv/a.pdf')).toBe(true);
    });
  });

  describe('remove', () => {
    it('apaga o arquivo quando ele existe', () => {
      const service = new CrlvStorageService();

      service.remove('/uploads/crlv/a.pdf');

      expect(mocked.unlinkSync).toHaveBeenCalledWith('/uploads/crlv/a.pdf');
    });

    it('não faz nada quando o arquivo não existe ou o caminho é vazio', () => {
      const service = new CrlvStorageService();
      mocked.existsSync.mockReturnValue(false);

      service.remove('/uploads/crlv/a.pdf');
      service.remove(undefined);

      expect(mocked.unlinkSync).not.toHaveBeenCalled();
    });

    it('não propaga a falha do disco (melhor esforço)', () => {
      const service = new CrlvStorageService();
      mocked.unlinkSync.mockImplementation(() => {
        throw new Error('EACCES');
      });

      expect(() => service.remove('/uploads/crlv/a.pdf')).not.toThrow();
    });
  });
});
