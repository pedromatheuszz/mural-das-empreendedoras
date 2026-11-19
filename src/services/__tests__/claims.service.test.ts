import { getMyProfileClaim, linkProfileToAccount, requestProfileClaim, reviewProfileClaim } from '../claims.service';

const mockRpc = jest.fn();
jest.mock('@/lib/data-api', () => ({
  db: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

beforeEach(() => {
  mockRpc.mockReset();
  mockRpc.mockResolvedValue({ data: null, error: null });
});

describe('vínculo de perfil do grupo', () => {
  it('envia o pedido com a mensagem limpa (ou sem mensagem)', async () => {
    await requestProfileClaim('perfil-1', '  Sou a Camila,   dona da marca.  ');
    expect(mockRpc).toHaveBeenCalledWith('request_profile_claim', {
      target_profile_id: 'perfil-1',
      note: 'Sou a Camila, dona da marca.',
    });
    await requestProfileClaim('perfil-1', '   ');
    expect(mockRpc).toHaveBeenLastCalledWith('request_profile_claim', { target_profile_id: 'perfil-1', note: null });
  });

  it('devolve o último pedido da conta ou null', async () => {
    mockRpc.mockResolvedValueOnce({ data: [{ id: 'c1', status: 'pending' }], error: null });
    expect(await getMyProfileClaim()).toEqual({ id: 'c1', status: 'pending' });
    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    expect(await getMyProfileClaim()).toBeNull();
  });

  it('a equipe aprova/recusa e vincula pelo e-mail normalizado', async () => {
    await reviewProfileClaim({ claimId: 'c1', approve: false, note: 'Não confirmado.' });
    expect(mockRpc).toHaveBeenCalledWith('review_profile_claim', {
      target_claim_id: 'c1',
      approve: false,
      note: 'Não confirmado.',
    });
    await linkProfileToAccount('perfil-1', '  Clara@Exemplo.com ');
    expect(mockRpc).toHaveBeenLastCalledWith('link_profile_to_account', {
      target_profile_id: 'perfil-1',
      target_email: 'clara@exemplo.com',
    });
  });

  it('propaga o erro do banco (ex.: perfil já vinculado)', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: 'P0001', message: 'Este perfil já está vinculado a uma conta.', details: null } });
    await expect(requestProfileClaim('perfil-1')).rejects.toMatchObject({ message: 'Este perfil já está vinculado a uma conta.' });
  });
});
