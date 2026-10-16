import { expect, it, vi } from 'vitest';

// simula il caso di chi clona il repository senza creare js/config.js
vi.mock('../../js/config-loader.js', () => ({ loadApiKey: async () => null }));

it('senza config.js mostra come configurare la chiave invece di chiamare l’API', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { fetchTMDB } = await import('../../js/api.js');

    await expect(fetchTMDB('/movie/popular')).rejects.toThrow('copia js/config.example.js in js/config.js');
    expect(fetch).not.toHaveBeenCalled();
});
