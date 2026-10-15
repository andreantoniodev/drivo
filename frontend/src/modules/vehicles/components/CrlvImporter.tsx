'use client';

import React, { useRef, useState } from 'react';
import { CheckCircle2, FileText, ScanLine } from 'lucide-react';
import { Alert, Button } from '@/shared/design-system';
import { cn } from '@/lib/utils';
import { useCrlvScan } from '../hooks/useCrlvScan';
import { CrlvExtractionResponse } from '../types';
import { formatFileSize } from '../utils/crlv-file';

export interface CrlvImporterProps {
  onScanComplete: (data: CrlvExtractionResponse, file: File) => void;
  className?: string;
}

export const CrlvImporter: React.FC<CrlvImporterProps> = ({ onScanComplete, className }) => {
  const { scan, isScanning, error } = useCrlvScan();
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isMock, setIsMock] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const result = await scan(file);
    if (!result) return;

    setCurrentFile(file);
    setIsMock(result.isMock);
    onScanComplete(result, file);
  };

  return (
    <div className={cn('w-full bg-surface rounded-[20px] p-6 flex flex-col gap-5', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
        data-testid="crlv-file-input"
      />

      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-[10px] bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <ScanLine className="w-5 h-5" aria-hidden />
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 className="text-[17px] font-semibold text-fg">Importar CRLV</h2>
          <p className="text-[13px] text-fg-muted">Preenchemos o formulário para você</p>
        </div>
      </div>

      {currentFile ? (
        <div className="bg-surface-2 rounded-xl px-3.5 py-3 flex items-center gap-3">
          <FileText className="w-5 h-5 text-danger shrink-0" aria-hidden />
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <p className="text-sm font-medium text-fg truncate">{currentFile.name}</p>
            <p className="text-xs text-fg-subtle">
              {formatFileSize(currentFile.size)} · lido agora
              {isMock ? ' · dados simulados' : ''}
            </p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden />
        </div>
      ) : (
        <div className="bg-surface-2 rounded-xl px-3.5 py-3 flex items-center gap-3">
          <FileText className="w-5 h-5 text-fg-subtle shrink-0" aria-hidden />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-fg-muted">Nenhum arquivo selecionado</p>
            <p className="text-xs text-fg-subtle">PDF, JPG ou PNG · até 10 MB</p>
          </div>
        </div>
      )}

      <Button
        variant="secondary"
        isLoading={isScanning}
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
      >
        {currentFile ? 'Importar outro CRLV' : 'Escolher arquivo'}
      </Button>

      {error && <Alert>{error}</Alert>}
    </div>
  );
};
