import { describe, expect, it } from 'vitest';
import { syncStatusMessage, WebSyncProvider } from './sync-status';

describe('WebSyncProvider', () => {
  it('clears the queue and cursor together when an account is removed', async () => {
    const storage = new Map<string, string>();
    const provider = new WebSyncProvider({
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => void storage.set(key, value),
      removeItem: (key) => void storage.delete(key),
      clear: () => storage.clear(),
      key: (index) => [...storage.keys()][index] ?? null,
      get length() { return storage.size; },
    });
    await provider.enqueue({
      id: 'sync-1', method: 'POST', path: '/reports', body: {}, createdAt: '2026-01-01T00:00:00.000Z', conflictPolicy: 'student-wins',
    });
    await provider.setCursor('cursor-1');

    await provider.clear();

    await expect(provider.pending()).resolves.toEqual([]);
    await expect(provider.getCursor()).resolves.toBeNull();
  });
});

describe('syncStatusMessage', () => {
  it('keeps failed changes explicit and retryable in Persian', () => {
    expect(syncStatusMessage('failed', 2)).toEqual({
      label: 'نیازمند توجه',
      detail: '۲ تغییر روی دستگاه شما محفوظ است. برای تلاش دوباره، همگام‌سازی را اجرا کنید.',
      canRetry: true,
    });
  });

  it('does not offer a retry while the device is offline', () => {
    expect(syncStatusMessage('offline', 0)).toMatchObject({
      label: 'آفلاین',
      canRetry: false,
    });
  });
});
