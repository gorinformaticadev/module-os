const PROTECTED_MODULE_PREFIXES = ['/api/ordem_servico/', '/ordem_servico/'];
const LEGACY_PRODUCT_PATH_REGEX = /^\/(?:api\/)?uploads\/produtos\/([^/]+)\/([^?#]+)$/i;

function normalizeSlashes(value: string) {
  return value.replace(/\\/g, '/');
}

function extractProtectedPathFallback(value: string): string | null {
  const normalizedValue = normalizeSlashes(value);
  const lowerValue = normalizedValue.toLowerCase();
  const apiPrefix = '/api/ordem_servico/';
  const modulePrefix = '/ordem_servico/';

  const apiIndex = lowerValue.indexOf(apiPrefix);
  if (apiIndex >= 0) {
    return normalizedValue.slice(apiIndex);
  }

  const moduleIndex = lowerValue.indexOf(modulePrefix);
  if (moduleIndex >= 0) {
    return `/api${normalizedValue.slice(moduleIndex)}`;
  }

  return null;
}

function extractPathAndSearch(src: string) {
  try {
    const parsedUrl = new URL(normalizeSlashes(src), 'http://localhost');
    const pathname = normalizeSlashes(parsedUrl.pathname);
    return `${pathname}${parsedUrl.search}`;
  } catch {
    return normalizeSlashes(src);
  }
}

export function normalizeProtectedOrdemServicoMediaSrc(src?: string | null): string | null {
  const rawValue = typeof src === 'string' ? normalizeSlashes(src.trim()) : '';
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

  const fallbackPath = extractProtectedPathFallback(pathWithSearch) || extractProtectedPathFallback(rawValue);
  if (fallbackPath) {
    return fallbackPath;
  }

  return rawValue;
}

export function isProtectedOrdemServicoMediaSrc(src?: string | null): boolean {
  const normalized = normalizeProtectedOrdemServicoMediaSrc(src);

  return !!normalized && PROTECTED_MODULE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}
