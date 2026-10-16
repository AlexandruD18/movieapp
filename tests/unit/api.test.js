import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// config.js non è nel repository: nei test la chiave arriva da qui
vi.mock('../../js/config-loader.js', () => ({ loadApiKey: async () => 'test-key' }));

const jsonResponse = (body, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
});

let api;

beforeEach(async () => {
    vi.resetModules(); // cache delle richieste nuova per ogni test
    vi.stubGlobal('fetch', vi.fn());
    api = await import('../../js/api.js');
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('fetchTMDB', () => {
    it('costruisce la URL con chiave, lingua e parametri', async () => {
        fetch.mockResolvedValue(jsonResponse({ results: [] }));
        await api.fetchTMDB('/movie/popular', { page: 2 });

        const url = new URL(fetch.mock.calls[0][0]);
        expect(url.origin + url.pathname).toBe('https://api.themoviedb.org/3/movie/popular');
        expect(url.searchParams.get('api_key')).toBe('test-key');
        expect(url.searchParams.get('language')).toBe('it-IT');
        expect(url.searchParams.get('page')).toBe('2');
    });

    it('scarica la stessa URL una sola volta', async () => {
        fetch.mockResolvedValue(jsonResponse({ results: [{ id: 1 }] }));
        const [first, second] = await Promise.all([api.getTrending('movie'), api.getTrending('movie')]);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(first).toEqual(second);
    });

    it('traduce gli stati HTTP in messaggi per l’utente', async () => {
        fetch.mockResolvedValue(jsonResponse({}, 401));
        await expect(api.fetchTMDB('/movie/popular')).rejects.toMatchObject({
            name: 'ApiError',
            status: 401,
            message: 'API key TMDB non valida.',
        });
    });

    it('segnala la rete assente', async () => {
        fetch.mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(api.fetchTMDB('/movie/popular')).rejects.toThrow('Connessione assente');
    });

    it('non tiene in cache gli errori, così "Riprova" rifà la richiesta', async () => {
        fetch
            .mockResolvedValueOnce(jsonResponse({}, 500))
            .mockResolvedValueOnce(jsonResponse({ results: [{ id: 7 }] }));

        await expect(api.getTopRatedMovies()).rejects.toThrow('500');
        await expect(api.getTopRatedMovies()).resolves.toMatchObject({ results: [{ id: 7 }] });
        expect(fetch).toHaveBeenCalledTimes(2);
    });
});

describe('endpoint', () => {
    it('normalizza le liste paginate', async () => {
        fetch.mockResolvedValue(jsonResponse({ results: [{ id: 1 }], page: 3, total_pages: 9, total_results: 170 }));
        await expect(api.getList('/tv/on_the_air', { page: 3 })).resolves.toEqual({
            results: [{ id: 1 }],
            page: 3,
            totalPages: 9,
            totalResults: 170,
        });
    });

    it('getGenres restituisce l’elenco dei generi', async () => {
        fetch.mockResolvedValue(jsonResponse({ genres: [{ id: 28, name: 'Azione' }] }));
        await expect(api.getGenres('movie')).resolves.toEqual([{ id: 28, name: 'Azione' }]);
        expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/3/genre/movie/list');
    });

    it('la ricerca tiene solo film e serie', async () => {
        fetch.mockResolvedValue(jsonResponse({
            results: [
                { id: 1, media_type: 'movie' },
                { id: 2, media_type: 'person' },
                { id: 3, media_type: 'tv' },
            ],
        }));
        const results = await api.searchMulti('nolan');
        expect(results.map((item) => item.id)).toEqual([1, 3]);
    });

    it('chiede dettaglio, cast, trailer, piattaforme e consigliati insieme', async () => {
        fetch.mockResolvedValue(jsonResponse({ id: 27205 }));
        await api.getDetail('movie', 27205);

        const url = new URL(fetch.mock.calls[0][0]);
        expect(url.pathname).toBe('/3/movie/27205');
        expect(url.searchParams.get('append_to_response')).toBe('credits,videos,watch/providers,recommendations');
    });
});

describe('getImageUrl', () => {
    it('compone la URL o restituisce null', () => {
        expect(api.getImageUrl('/abc.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg');
        expect(api.getImageUrl(null)).toBeNull();
    });
});
