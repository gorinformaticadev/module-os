import { describe, expect, it } from 'vitest';
import {
  isProtectedOrdemServicoMediaSrc,
  normalizeProtectedOrdemServicoMediaSrc,
} from './protected-media';

describe('protected ordem servico media helpers', () => {
  it('keeps authenticated module urls intact', () => {
    expect(
      normalizeProtectedOrdemServicoMediaSrc('/api/ordem_servico/clientes/uploads/tenant-1/avatar.jpg'),
    ).toBe('/api/ordem_servico/clientes/uploads/tenant-1/avatar.jpg');
  });

  it('maps legacy product uploads to the authenticated module route', () => {
    expect(
      normalizeProtectedOrdemServicoMediaSrc('/uploads/produtos/tenant-1/produto.jpg'),
    ).toBe('/api/ordem_servico/produtos/uploads/tenant-1/produto.jpg');
  });

  it('maps absolute legacy product urls without leaking the origin into the request path', () => {
    expect(
      normalizeProtectedOrdemServicoMediaSrc(
        'http://localhost:4000/uploads/produtos/tenant-1/produto.jpg?t=1',
      ),
    ).toBe('/api/ordem_servico/produtos/uploads/tenant-1/produto.jpg?t=1');
  });

  it('recognizes protected module media routes and ignores blob urls', () => {
    expect(isProtectedOrdemServicoMediaSrc('/api/ordem_servico/ordens/uploads/tenant-1/foto.jpg')).toBe(true);
    expect(isProtectedOrdemServicoMediaSrc('blob:http://localhost:5000/123')).toBe(false);
  });
});
