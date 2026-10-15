'use client';

import { useCallback, useState } from 'react';
import { getApiErrorMessage } from '@/shared/services/errors';
import { crlvService } from '../services/crlv.service';
import { CrlvExtractionResponse } from '../types';
import { validateCrlvFile } from '../utils/crlv-file';

export function useCrlvScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (file: File): Promise<CrlvExtractionResponse | null> => {
    const validationError = validateCrlvFile(file);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setError(null);
    setIsScanning(true);
    try {
      return await crlvService.scan(file);
    } catch (scanError) {
      setError(getApiErrorMessage(scanError, 'Falha ao processar o CRLV. Tente novamente.'));
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { scan, isScanning, error, clearError };
}
