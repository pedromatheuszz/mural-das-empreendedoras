import { compareVersions, getLatestRelease, getUpdateStatus, type AppRelease } from '../updates.service';

const mockRpc = jest.fn();
jest.mock('@/lib/data-api', () => ({
  db: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

const release = (version: string, min: string): AppRelease => ({
  version,
  min_supported_version: min,
  download_url: 'https://github.com/exemplo/mural/releases/download/v1/mural.apk',
  release_notes: null,
  created_at: '2026-11-19T00:00:00Z',
});

describe('atualização do app', () => {
  it('compara versões numericamente (1.0.10 é maior que 1.0.9)', () => {
    expect(compareVersions('1.0.10', '1.0.9')).toBeGreaterThan(0);
    expect(compareVersions('1.0.1', '1.0.1')).toBe(0);
    expect(compareVersions('1.0', '1.0.1')).toBeLessThan(0);
    expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
  });

  it('obrigatória abaixo da mínima, opcional abaixo da última, nada se já está atualizada', () => {
    expect(getUpdateStatus('1.0.1', release('1.0.2', '1.0.2'))).toBe('required');
    expect(getUpdateStatus('1.0.1', release('1.0.3', '1.0.0'))).toBe('available');
    expect(getUpdateStatus('1.0.3', release('1.0.3', '1.0.3'))).toBe('current');
    expect(getUpdateStatus('1.0.4', release('1.0.3', '1.0.3'))).toBe('current');
    expect(getUpdateStatus('1.0.1', null)).toBe('current');
  });

  it('busca a última versão da plataforma pela API', async () => {
    mockRpc.mockResolvedValueOnce({ data: [release('1.0.2', '1.0.2')], error: null });
    expect(await getLatestRelease()).toMatchObject({ version: '1.0.2' });
    expect(mockRpc).toHaveBeenCalledWith('latest_app_release', { target_platform: 'ios' });
    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    expect(await getLatestRelease()).toBeNull();
  });
});
