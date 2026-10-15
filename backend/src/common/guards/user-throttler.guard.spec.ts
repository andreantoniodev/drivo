import { UserThrottlerGuard } from './user-throttler.guard';

describe('UserThrottlerGuard', () => {
  const guard = Object.create(
    UserThrottlerGuard.prototype,
  ) as UserThrottlerGuard;
  const getTracker = (req: Record<string, unknown>) =>
    (guard as any).getTracker(req) as Promise<string>;

  it('deve usar o id do usuário autenticado como chave', async () => {
    await expect(
      getTracker({ user: { id: 'abc' }, ip: '10.0.0.1' }),
    ).resolves.toBe('user:abc');
  });

  it('deve usar o IP quando não houver usuário (rotas públicas)', async () => {
    await expect(getTracker({ ip: '10.0.0.1' })).resolves.toBe('10.0.0.1');
  });

  it('deve preferir o primeiro IP da cadeia de proxies', async () => {
    await expect(
      getTracker({ ips: ['203.0.113.7', '10.0.0.1'], ip: '10.0.0.1' }),
    ).resolves.toBe('203.0.113.7');
  });
});
