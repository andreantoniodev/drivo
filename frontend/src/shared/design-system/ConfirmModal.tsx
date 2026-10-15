'use client';

import React, { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  className?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  isLoading = false,
  onConfirm,
  onClose,
  className,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/70 backdrop-blur-[6px]"
      onClick={() => !isLoading && onClose()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className={cn(
          'w-full max-w-[400px] bg-surface rounded-3xl p-7 flex flex-col items-center gap-6',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="w-[52px] h-[52px] rounded-full bg-danger/15 text-danger flex items-center justify-center">
          <TriangleAlert className="w-5 h-5" aria-hidden />
        </span>

        <div className="flex flex-col items-center gap-2 text-center w-full">
          <h3
            id="confirm-modal-title"
            className="text-[19px] font-semibold tracking-[-0.3px] text-fg"
          >
            {title}
          </h3>
          <p id="confirm-modal-description" className="text-sm leading-[1.45] text-fg-muted">
            {description}
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} className="flex-1">
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading} className="flex-1">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
