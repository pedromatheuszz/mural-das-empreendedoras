import { formatLocation, getFirstName, getInitials } from '../format';
import { nullIfEmpty, sanitizeLine, sanitizeMultiline } from '../sanitize';

describe('sanitizeLine', () => {
  it('remove espaços extras, quebras e caracteres invisíveis', () => {
    expect(sanitizeLine('  Doces\n da\t\tAna  ')).toBe('Doces da Ana');
    expect(sanitizeLine('Ana​ Souza‮')).toBe('Ana Souza');
    expect(sanitizeLine(null)).toBe('');
  });

  it('preserva emojis compostos (ZWJ)', () => {
    const family = 'Ateliê 👩‍👧';
    expect(sanitizeLine(family)).toBe(family);
  });
});

describe('sanitizeMultiline', () => {
  it('mantém parágrafos e limita linhas em branco', () => {
    expect(sanitizeMultiline('Bolos  e doces.\r\n\r\n\r\n\r\nEntrega   em Joinville. ')).toBe(
      'Bolos e doces.\n\nEntrega em Joinville.',
    );
  });

  it('remove caracteres de controle', () => {
    expect(sanitizeMultiline('Texto\u0000 limpo\u0007')).toBe('Texto limpo');
  });
});

describe('formatação', () => {
  it('gera iniciais e primeiro nome', () => {
    expect(getInitials('Ana Maria Souza')).toBe('AS');
    expect(getInitials('ateliê')).toBe('A');
    expect(getInitials('')).toBe('?');
    expect(getFirstName('Ana Souza')).toBe('Ana');
  });

  it('formata a localização', () => {
    expect(formatLocation('Joinville', 'SC')).toBe('Joinville, SC');
    expect(formatLocation(null, 'SP')).toBe('SP');
    expect(formatLocation(null, null)).toBeNull();
  });

  it('nullIfEmpty', () => {
    expect(nullIfEmpty('   ')).toBeNull();
    expect(nullIfEmpty(' a ')).toBe('a');
  });
});
