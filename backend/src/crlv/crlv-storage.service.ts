import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface StoredCrlvFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
}

@Injectable()
export class CrlvStorageService {
  private readonly logger = new Logger(CrlvStorageService.name);
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads', 'crlv');

  constructor() {
    this.ensureUploadDir();
  }

  save(file: Express.Multer.File): StoredCrlvFile {
    this.ensureUploadDir();

    const extension = path.extname(file.originalname) || '.pdf';
    const filePath = path.join(this.uploadDir, `${randomUUID()}${extension}`);
    fs.writeFileSync(filePath, file.buffer);

    return {
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath,
    };
  }

  exists(filePath?: string | null): filePath is string {
    return Boolean(filePath) && fs.existsSync(filePath as string);
  }

  remove(filePath?: string | null): void {
    if (!this.exists(filePath)) return;

    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Erro ao excluir arquivo do CRLV: ${reason}`);
    }
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }
}
