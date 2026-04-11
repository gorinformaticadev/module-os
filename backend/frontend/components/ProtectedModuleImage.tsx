"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  isProtectedOrdemServicoMediaSrc,
  normalizeProtectedOrdemServicoMediaSrc,
} from '../utils/protected-media';

type ProtectedModuleImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallback?: React.ReactNode;
};

export default function ProtectedModuleImage({
  src,
  fallback = null,
  alt = '',
  ...imgProps
}: ProtectedModuleImageProps) {
  const normalizedSrc = normalizeProtectedOrdemServicoMediaSrc(src);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    if (!normalizedSrc) {
      return null;
    }

    return isProtectedOrdemServicoMediaSrc(normalizedSrc) ? null : normalizedSrc;
  });
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    setLoadError(false);

    if (!normalizedSrc) {
      setResolvedSrc(null);
      return () => {
        active = false;
      };
    }

    const isProtectedSrc = isProtectedOrdemServicoMediaSrc(normalizedSrc);
    if (!isProtectedSrc) {
      setResolvedSrc(normalizedSrc);
      return () => {
        active = false;
      };
    }

    setResolvedSrc(null);

    const controller = new AbortController();

    void api
      .get(normalizedSrc, {
        responseType: 'blob',
        signal: controller.signal,
      })
      .then((response) => {
        if (!active) {
          return;
        }

        objectUrl = URL.createObjectURL(response.data);
        setResolvedSrc(objectUrl);
      })
      .catch((error: any) => {
        if (!active || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
          return;
        }

        setLoadError(true);
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [normalizedSrc]);

  if (!normalizedSrc || loadError || !resolvedSrc) {
    return <>{fallback}</>;
  }

  return <img {...imgProps} src={resolvedSrc} alt={alt} />;
}
