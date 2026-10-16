import { useMemo } from 'react';

const RESERVED_HOST_PREFIXES = [
  'www',
  'api',
  'admin',
  'app',
  'amazingdeal-storefront',
  'amazingdeal-admin',
  'storefront',
];

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

    // On Cloudflare Workers/Pages default domains (*.workers.dev, *.pages.dev),
    // the first subdomain part is the worker project name, not a merchant subdomain.
    if (host.includes('workers.dev') || host.includes('pages.dev')) {
      return 'guptakiranastore';
    }

    // e.g. storename.amazingdeal.co.in (4 parts) or store.customdomain.com
    if (parts.length >= 3 && !RESERVED_HOST_PREFIXES.includes(parts[0])) {
      return parts[0];
    }

    // e.g. storename.localhost (2 parts)
    if (parts.length === 2 && parts[1] === 'localhost' && !RESERVED_HOST_PREFIXES.includes(parts[0])) {
      return parts[0];
    }

    // Default demo store fallback for direct root access
    return 'guptakiranastore';
  }, []);
}

