const PROTECTED_MODULE_PREFIXES = ['/api/ordem_servico/', '/ordem_servico/'];
const LEGACY_PRODUCT_PATH_REGEX = /^\/(?:api\/)?uploads\/produtos\/([^/]+)\/([^?#]+)$/i;

function extractPathAndSearch(src: string) {
  try {
    const parsedUrl = new URL(src, 'http://localhost');
    return `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return src;
  }
}

export function normalizeProtectedOrdemServicoMediaSrc(src?: string | null): string | null {
  const rawValue = typeof src === 'string' ? src.trim() : '';
  if (!rawValue) {
    return null;
  }

  if (/^(blob:|data:)/i.test(rawValue)) {
    return rawValue;
  }

  const pathWithSearch = extractPathAndSearch(rawValue);
  const [pathname, query = ''] = pathWithSearch.split('?');
  const legacyProductMatch = pathname.match(LEGACY_PRODUCT_PATH_REGEX);

  if (legacyProductMatch) {
    const [, tenantId, filename] = legacyProductMatch;
    return `/api/ordem_servico/produtos/uploads/${tenantId}/${filename}${query ? `?${query}` : ''}`;
  }

  if (pathname.startsWith('/ordem_servico/')) {
    return `/api${pathWithSearch}`;
  }

  if (pathname.startsWith('/api/ordem_servico/')) {
    return pathWithSearch;
  }

  return rawValue;
}

export function isProtectedOrdemServicoMediaSrc(src?: string | null): boolean {
  const normalized = normalizeProtectedOrdemServicoMediaSrc(src);

  return !!normalized && PROTECTED_MODULE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}
