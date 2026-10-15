import { SerializeOptions } from '@nestjs/common';
import type { Type } from '@nestjs/common';

export const SerializeAs = (dto: Type<unknown>) =>
  SerializeOptions({ type: dto, excludeExtraneousValues: true });
