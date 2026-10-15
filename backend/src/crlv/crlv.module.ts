import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CrlvController } from './crlv.controller';
import { CrlvService } from './crlv.service';
import { CrlvStorageService } from './crlv-storage.service';
import { GeminiExtractionService } from './gemini-extraction.service';

@Module({
  imports: [PrismaModule],
  controllers: [CrlvController],
  providers: [CrlvService, GeminiExtractionService, CrlvStorageService],
  exports: [CrlvService],
})
export class CrlvModule {}
