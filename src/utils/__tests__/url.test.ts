import {
  describeLink,
  formatPhone,
  linkToInputValue,
  normalizeContact,
  normalizeSocialLink,
  normalizeUrl,
  toWhatsAppNumber,
} from '../url';

describe('normalizeUrl', () => {
  it('adiciona https e remove a barra final', () => {
    expect(normalizeUrl('www.minhaloja.com.br')).toBe('https://www.minhaloja.com.br');
    expect(normalizeUrl('  minhaloja.com.br/catalogo ')).toBe('https://minhaloja.com.br/catalogo');
    expect(normalizeUrl('http://site.com')).toBe('http://site.com');
  });

  it('rejeita esquemas perigosos e endereços inválidos', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('data:text/html;base64,AAAA')).toBeNull();
    expect(normalizeUrl('mailto:ana@site.com')).toBeNull();
    expect(normalizeUrl('https://user:senha@site.com')).toBeNull();
    expect(normalizeUrl('minha loja')).toBeNull();
    expect(normalizeUrl('localhost')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
  });
});

describe('normalizeSocialLink', () => {
  it('converte @usuario em link do Instagram', () => {
    expect(normalizeSocialLink('@doces.da.ana')).toBe('https://instagram.com/doces.da.ana');
    expect(normalizeSocialLink('doces_da_ana')).toBe('https://instagram.com/doces_da_ana');
  });

  it('aceita links de outras redes e recusa entradas inválidas', () => {
    expect(normalizeSocialLink('tiktok.com/@ana')).toBe('https://tiktok.com/@ana');
    expect(normalizeSocialLink('minhamarca.com.br')).toBe('https://minhamarca.com.br');
    expect(normalizeSocialLink('@nome com espaço')).toBeNull();
  });
});

describe('WhatsApp e contato', () => {
  it('converte telefone brasileiro com DDD para wa.me', () => {
    expect(toWhatsAppNumber('(47) 99999-8888')).toBe('5547999998888');
    expect(toWhatsAppNumber('047 3333-4444')).toBe('554733334444');
    expect(toWhatsAppNumber('+55 11 91234-5678')).toBe('5511912345678');
    expect(normalizeContact('(11) 91234-5678')).toBe('https://wa.me/5511912345678');
  });

  it('aceita número internacional com + e rejeita números incompletos', () => {
    expect(toWhatsAppNumber('+351 912 345 678')).toBe('351912345678');
    expect(toWhatsAppNumber('9999-8888')).toBeNull();
    expect(normalizeContact('12345')).toBeNull();
  });

  it('aceita links de agenda/catálogo', () => {
    expect(normalizeContact('calendly.com/ana')).toBe('https://calendly.com/ana');
  });

  it('formata o telefone para exibição', () => {
    expect(formatPhone('5547999998888')).toBe('(47) 99999-8888');
    expect(formatPhone('554733334444')).toBe('(47) 3333-4444');
    expect(formatPhone('351912345678')).toBe('+351912345678');
  });
});

describe('describeLink e linkToInputValue', () => {
  it('identifica redes, WhatsApp e sites', () => {
    expect(describeLink('https://wa.me/5547999998888')).toEqual({
      kind: 'whatsapp',
      label: 'WhatsApp',
      display: '(47) 99999-8888',
    });
    expect(describeLink('https://www.instagram.com/doces.da.ana/')).toMatchObject({
      kind: 'instagram',
      display: '@doces.da.ana',
    });
    expect(describeLink('https://minhaloja.com.br')).toMatchObject({ kind: 'website', display: 'minhaloja.com.br' });
  });

  it('devolve o valor amigável para edição', () => {
    expect(linkToInputValue('https://wa.me/5547999998888')).toBe('(47) 99999-8888');
    expect(linkToInputValue('https://instagram.com/ana')).toBe('@ana');
    expect(linkToInputValue('https://minhaloja.com.br')).toBe('https://minhaloja.com.br');
    expect(linkToInputValue(null)).toBe('');
  });
});
