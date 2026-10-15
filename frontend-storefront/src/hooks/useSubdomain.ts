import { useMemo } from 'react';

export function useSubdomain(): string {
  return useMemo(() => {
    // 1. Check query parameter (?store=... or ?subdomain=... or ?tenant=...)
    const params = new URLSearchParams(window.location.search);
    const paramSub = params.get('store') || params.get('subdomain') || params.get('tenant');
    if (paramSub && paramSub.trim()) {
      return paramSub.trim().toLowerCase();
    }

    // 2. Parse hostname
    const host = window.location.hostname.toLowerCase();
    const parts = host.split('.');

    // e.g. sharma.amazingdeal.co.in (4 parts) or sharma.pages.dev (3 parts)
    if (parts.length >= 3 && !['www', 'api', 'admin', 'app'].includes(parts[0])) {
      return parts[0];
    }

    // e.g. sharma.localhost (2 parts)
    if (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www') {
      return parts[0];
    }

    // Default demo store fallback for direct root access
    return 'sharma';
  }, []);
}
