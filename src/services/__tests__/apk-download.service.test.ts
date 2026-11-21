import { createSpeedMeter, formatBytes, formatTimeLeft, progressPercent } from '../apk-download.service';

jest.mock('expo-file-system', () => ({ Directory: jest.fn(), DownloadTask: jest.fn(), File: jest.fn(), Paths: {} }));
jest.mock('expo-intent-launcher', () => ({ startActivityAsync: jest.fn() }));
jest.mock('@/lib/secure-storage', () => ({ preferences: { getFlag: jest.fn(), setFlag: jest.fn() } }));

describe('download da atualização', () => {
  it('calcula a porcentagem sem passar de 100 e com tamanho desconhecido', () => {
    expect(progressPercent(50, 200)).toBe(25);
    expect(progressPercent(199, 200)).toBe(99);
    expect(progressPercent(300, 200)).toBe(100);
    expect(progressPercent(10, -1)).toBe(0);
  });

  it('formata tamanhos em pt-BR', () => {
    expect(formatBytes(512 * 1024)).toBe('512 KB');
    expect(formatBytes(70.1 * 1024 * 1024)).toBe('70,1 MB');
    expect(formatBytes(4.46 * 1024 ** 3)).toBe('4,46 GB');
  });

  it('estima o tempo restante', () => {
    const mb = 1024 * 1024;
    expect(formatTimeLeft(60 * mb, 70 * mb, 5 * mb)).toBe('2 s');
    expect(formatTimeLeft(0, 70 * mb, 0.5 * mb)).toBe('2 min 20 s');
    expect(formatTimeLeft(0, 70 * mb, 0)).toBe('--');
    expect(formatTimeLeft(0, -1, mb)).toBe('--');
  });

  it('mede a velocidade com média suavizada', () => {
    let now = 0;
    const meter = createSpeedMeter(() => now);
    expect(meter.sample(0)).toBe(0);
    now = 1000;
    expect(meter.sample(1000)).toBe(1000);
    now = 2000;
    expect(meter.sample(3000)).toBeCloseTo(1000 * 0.7 + 2000 * 0.3);
    now = 2100; // menos de 250 ms: mantém a última medida
    expect(meter.sample(9000)).toBeCloseTo(1300);
  });
});
