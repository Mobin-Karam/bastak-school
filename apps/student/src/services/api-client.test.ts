import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from './api-client';

const jsonResponse = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

describe('ApiClient session refresh', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('rotates CSRF state and retries once after an expired access cookie', async () => {
    const client = new ApiClient('/api/v2');
    client.setCsrfToken('old-csrf');
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { ok: false, error: { code: 'UNAUTHORIZED' } }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true, data: { csrfToken: 'new-csrf' } }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true, data: { id: 'student-1' } }));

    await expect(client.request<{ id: string }>('GET', '/students/me')).resolves.toEqual({ id: 'student-1' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v2/auth/refresh');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ headers: expect.objectContaining({ 'X-CSRF-Token': 'old-csrf' }) });
    expect(client.getCsrfToken()).toBe('new-csrf');
  });

  it('clears stale CSRF state when refresh is rejected', async () => {
    const client = new ApiClient('/api/v2');
    client.setCsrfToken('stale-csrf');
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { ok: false, error: { code: 'UNAUTHORIZED' } }))
      .mockResolvedValueOnce(jsonResponse(401, { ok: false, error: { code: 'REFRESH_EXPIRED' } }));

    await expect(client.request('GET', '/students/me')).rejects.toMatchObject({ name: 'UNAUTHORIZED' });
    expect(client.getCsrfToken()).toBeNull();
  });

  it('does not enter a refresh loop when the retried request is still unauthorized', async () => {
    const client = new ApiClient('/api/v2');
    client.setCsrfToken('old-csrf');
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { ok: false, error: { code: 'UNAUTHORIZED' } }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true, data: { csrfToken: 'new-csrf' } }))
      .mockResolvedValueOnce(jsonResponse(401, { ok: false, error: { code: 'UNAUTHORIZED' } }));

    await expect(client.request('GET', '/students/me')).rejects.toMatchObject({ name: 'UNAUTHORIZED' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns a useful localized error when the network is unavailable', async () => {
    const client = new ApiClient('/api/v2');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(client.request('POST', '/auth/login', { username: 'student', password: 'secret' })).rejects.toMatchObject({
      name: 'NETWORK',
      message: 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.',
    });
  });

  it('queues only mutations that the backend sync endpoint accepts', async () => {
    const client = new ApiClient('/api/v2');
    const enqueue = vi.fn().mockResolvedValue(undefined);
    client.configureSync({ enqueue, pending: vi.fn(), remove: vi.fn() });
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(client.request('PUT', '/notifications/notice-1/read')).rejects.toMatchObject({ name: 'NETWORK' });
    await expect(client.request('POST', '/student/tasks/task-1/complete', { status: 'done' })).rejects.toMatchObject({ name: 'NETWORK' });

    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      path: '/student/tasks/task-1/complete',
    }));
  });

  it('clears the configured sync provider during account teardown', async () => {
    const client = new ApiClient('/api/v2');
    const clear = vi.fn().mockResolvedValue(undefined);
    client.configureSync({ enqueue: vi.fn(), pending: vi.fn(), remove: vi.fn(), clear });

    await client.clearSyncState();

    expect(clear).toHaveBeenCalledOnce();
  });
});
