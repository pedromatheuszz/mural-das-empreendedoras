import { emptyProfileForm } from '@/schemas/profile.schema';

import {
  createProfile,
  getPublicProfile,
  listHubProfiles,
  searchProfiles,
  setPublicationStatus,
  SUMMARY_COLUMNS,
  updateProfile,
} from '../profiles.service';
import { removeImages, uploadProfileImage } from '../storage.service';

type Result = { data: unknown; error: unknown };

/** Construtor de consultas falso: registra as chamadas e resolve com o resultado configurado. */
function queryBuilder(result: Result) {
  const calls: unknown[][] = [];
  const builder: Record<string, unknown> = { calls };
  for (const method of ['select', 'eq', 'order', 'range', 'limit', 'insert', 'update', 'delete', 'maybeSingle', 'single']) {
    builder[method] = jest.fn((...args: unknown[]) => {
      calls.push([method, ...args]);
      return builder;
    });
  }
  builder.then = (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return builder as Record<string, jest.Mock> & { calls: unknown[][] };
}

const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('@/lib/data-api', () => ({
  db: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

jest.mock('../storage.service', () => ({
  isLocalImage: (uri: string | null) => Boolean(uri) && !/^https?:\/\//.test(uri ?? ''),
  uploadProfileImage: jest.fn(async (_userId: string, _uri: string, kind: string) => `https://cdn.exemplo.com/${kind}.jpg`),
  removeImages: jest.fn(async () => undefined),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listagem do Mural', () => {
  it('busca só perfis publicados, em ordem alfabética e paginados', async () => {
    const items = Array.from({ length: 12 }, (_, index) => ({ id: String(index) }));
    const query = queryBuilder({ data: items, error: null });
    mockFrom.mockReturnValue(query);

    const page = await listHubProfiles({ page: 1, category: 'beleza' });

    expect(mockFrom).toHaveBeenCalledWith('entrepreneur_profiles');
    expect(query.calls).toEqual(
      expect.arrayContaining([
        ['select', SUMMARY_COLUMNS],
        ['eq', 'publication_status', 'published'],
        ['eq', 'category', 'beleza'],
        ['order', 'sort_name', { ascending: true }],
        ['range', 12, 23],
      ]),
    );
    expect(page.nextPage).toBe(2);
  });

  it('indica o fim da lista quando a página vem incompleta', async () => {
    mockFrom.mockReturnValue(queryBuilder({ data: [{ id: '1' }], error: null }));
    const page = await listHubProfiles({ page: 0, category: null });
    expect(page.nextPage).toBeUndefined();
  });

  it('propaga erros do banco', async () => {
    mockFrom.mockReturnValue(queryBuilder({ data: null, error: { code: '42501', message: 'denied', details: null } }));
    await expect(listHubProfiles({ page: 0, category: null })).rejects.toMatchObject({ code: '42501' });
  });
});

describe('busca', () => {
  it('chama a função de busca com termo, categoria e paginação', async () => {
    const query = queryBuilder({ data: [], error: null });
    mockRpc.mockReturnValue(query);
    await searchProfiles({ query: '  bolo de festa  ', category: 'gastronomia', page: 2 });
    expect(mockRpc).toHaveBeenCalledWith('search_entrepreneur_profiles', {
      search_query: 'bolo de festa',
      category_filter: 'gastronomia',
      page_size: 12,
      page_offset: 24,
    });
    expect(query.calls).toEqual([['select', SUMMARY_COLUMNS]]);
  });
});

describe('perfil público', () => {
  it('não consulta o banco com identificador inválido', async () => {
    expect(await getPublicProfile('nao-e-um-uuid')).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('nunca seleciona dados da conta (como e-mail)', async () => {
    const query = queryBuilder({ data: null, error: null });
    mockFrom.mockReturnValue(query);
    await getPublicProfile('11111111-1111-4111-8111-111111111111');
    const select = query.calls.find((call) => call[0] === 'select')?.[1] as string;
    expect(select).not.toMatch(/email|full_name|public_consent_at|suspension/);
  });
});

describe('criação e publicação', () => {
  const values = {
    ...emptyProfileForm('Ana Souza'),
    businessName: 'Doces da Ana',
    serviceDescription: 'Bolos decorados e doces finos por encomenda.',
    logoUri: 'file:///tmp/logo.jpg',
    contact: '(47) 99999-8888',
  };

  it('envia imagens locais, normaliza os dados e registra o consentimento ao publicar', async () => {
    const query = queryBuilder({ data: { id: 'novo' }, error: null });
    mockFrom.mockReturnValue(query);

    await createProfile({ userId: 'user-1', values, publish: true });

    expect(uploadProfileImage).toHaveBeenCalledWith('user-1', 'file:///tmp/logo.jpg', 'logo');
    const inserted = query.calls.find((call) => call[0] === 'insert')?.[1] as Record<string, unknown>;
    expect(inserted).toMatchObject({
      user_id: 'user-1',
      business_name: 'Doces da Ana',
      logo_url: 'https://cdn.exemplo.com/logo.jpg',
      profile_image_url: null,
      contact_url: 'https://wa.me/5547999998888',
      publication_status: 'published',
    });
    expect(inserted.public_consent_at).toEqual(expect.any(String));
  });

  it('salva rascunho sem consentimento e remove a imagem enviada se o banco recusar', async () => {
    const query = queryBuilder({ data: null, error: { code: '23514', message: 'check', details: null } });
    mockFrom.mockReturnValue(query);

    await expect(createProfile({ userId: 'user-1', values, publish: false })).rejects.toMatchObject({ code: '23514' });

    const inserted = query.calls.find((call) => call[0] === 'insert')?.[1] as Record<string, unknown>;
    expect(inserted).toMatchObject({ publication_status: 'draft', public_consent_at: null });
    expect(removeImages).toHaveBeenCalledWith(['https://cdn.exemplo.com/logo.jpg', null]);
  });

  it('não permite editar pelo app um perfil cadastrado pela organização', async () => {
    const curated = { id: 'p9', user_id: null, logo_url: null, profile_image_url: null } as unknown as Parameters<
      typeof updateProfile
    >[0]['profile'];
    await expect(updateProfile({ profile: curated, values })).rejects.toThrow(/organização do grupo/);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('publica com consentimento apenas quando solicitado', async () => {
    const query = queryBuilder({ data: { id: 'p1' }, error: null });
    mockFrom.mockReturnValue(query);
    await setPublicationStatus({ profileId: 'p1', status: 'unpublished' });
    expect(query.calls.find((call) => call[0] === 'update')?.[1]).toEqual({ publication_status: 'unpublished' });

    await setPublicationStatus({ profileId: 'p1', status: 'published', consent: true });
    const update = query.calls.filter((call) => call[0] === 'update')[1]?.[1] as Record<string, unknown>;
    expect(update.publication_status).toBe('published');
    expect(update.public_consent_at).toEqual(expect.any(String));
  });
});
