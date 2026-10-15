'use client';

import { useEffect, useState } from 'react';
import { api } from '@/shared/services/api';

export type AuthedImageState = {
  src: string | null;
  isLoading: boolean;
  hasError: boolean;
};

const cache = new Map<string, Promise<string>>();

function loadAuthedImage(url: string): Promise<string> {
  let pending = cache.get(url);
  if (!pending) {
    pending = api
      .get<Blob>(url, { responseType: 'blob' })
      .then((response) => URL.createObjectURL(response.data));
    pending.catch(() => cache.delete(url));
    cache.set(url, pending);
  }
  return pending;
}

export function isApiImagePath(url: string) {
  return url.startsWith('/');
}

export function useAuthedImage(url?: string | null): AuthedImageState {
  const [state, setState] = useState<{ url: string; src: string | null; failed: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (!url || !isApiImagePath(url)) return;

    let cancelled = false;
    loadAuthedImage(url)
      .then((src) => {
        if (!cancelled) setState({ url, src, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ url, src: null, failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url) return { src: null, isLoading: false, hasError: false };
  if (!isApiImagePath(url)) return { src: url, isLoading: false, hasError: false };

  const current = state?.url === url ? state : null;
  return {
    src: current?.src ?? null,
    isLoading: !current,
    hasError: current?.failed ?? false,
  };
}
