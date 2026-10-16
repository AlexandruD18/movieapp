import { beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'movieapp:favorites';

const movie = { id: 27205, title: 'Inception', poster_path: '/p.jpg', release_date: '2010-07-15', vote_average: 8.4, runtime: 148 };
const series = { id: 1396, name: 'Breaking Bad', first_air_date: '2008-01-20', vote_average: 9, episode_run_time: [47], number_of_episodes: 62 };

let favorites;

beforeEach(async () => {
    localStorage.clear();
    vi.resetModules(); // il modulo legge il localStorage all'import
    favorites = await import('../../js/favorites.js');
});

describe('la mia lista', () => {
    it('aggiunge e rimuove un titolo', () => {
        expect(favorites.toggleFavorite('movie', movie)).toBe(true);
        expect(favorites.isFavorite('movie', 27205)).toBe(true);

        expect(favorites.toggleFavorite('movie', movie)).toBe(false);
        expect(favorites.getFavorites()).toEqual([]);
    });

    it('distingue film e serie con lo stesso id', () => {
        favorites.toggleFavorite('movie', { ...movie, id: 1 });
        expect(favorites.isFavorite('tv', 1)).toBe(false);
    });

    it('salva un formato compatibile con createCard', () => {
        favorites.toggleFavorite('tv', series);
        const [saved] = favorites.getFavorites();

        expect(saved).toMatchObject({
            id: 1396,
            media_type: 'tv',
            title: 'Breaking Bad',
            release_date: '2008-01-20',
            runtime: 47 * 62,
        });
    });

    it('mette in cima l’ultimo aggiunto', () => {
        favorites.toggleFavorite('movie', movie);
        favorites.toggleFavorite('tv', series);
        expect(favorites.getFavorites().map((item) => item.id)).toEqual([1396, 27205]);
    });

    it('persiste nel localStorage e la rilegge al caricamento', async () => {
        favorites.toggleFavorite('movie', movie);
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1);

        vi.resetModules();
        const reloaded = await import('../../js/favorites.js');
        expect(reloaded.isFavorite('movie', 27205)).toBe(true);
    });

    it('ignora dati corrotti nel localStorage', async () => {
        localStorage.setItem(STORAGE_KEY, '{non è json');
        vi.resetModules();
        const reloaded = await import('../../js/favorites.js');
        expect(reloaded.getFavorites()).toEqual([]);
    });

    it('avvisa la pagina a ogni modifica', () => {
        const listener = vi.fn();
        favorites.onFavoritesChange(listener);
        favorites.toggleFavorite('movie', movie);
        expect(listener).toHaveBeenCalledOnce();
    });
});
