import { describe, expect, it } from 'vitest';
import { buildRequest, CATALOGS, parseState, stateToSearch } from '../../js/catalog.js';

const NOW = Date.UTC(2026, 9, 16); // 16 ottobre 2026

describe('parseState', () => {
    it('legge scheda e genere dall’URL', () => {
        expect(parseState('?list=top_rated&genre=28', 'movie')).toEqual({ list: 'top_rated', genre: 28 });
    });

    it('usa i valori predefiniti per parametri mancanti o non validi', () => {
        expect(parseState('', 'tv')).toEqual({ list: 'popular', genre: null });
        expect(parseState('?list=inventata&genre=abc', 'movie')).toEqual({ list: 'popular', genre: null });
    });

    it('una scheda esiste solo per il suo tipo', () => {
        expect(parseState('?list=upcoming', 'movie').list).toBe('upcoming');
        expect(parseState('?list=upcoming', 'tv').list).toBe('popular');
    });
});

describe('stateToSearch', () => {
    it('omette i valori predefiniti per avere URL puliti', () => {
        expect(stateToSearch({ list: 'popular', genre: null }, 'movie')).toBe('');
        expect(stateToSearch({ list: 'popular', genre: 16 }, 'movie')).toBe('?genre=16');
        expect(stateToSearch({ list: 'on_the_air', genre: 18 }, 'tv')).toBe('?list=on_the_air&genre=18');
    });

    it('è l’inverso di parseState', () => {
        const state = { list: 'airing_today', genre: 35 };
        expect(parseState(stateToSearch(state, 'tv'), 'tv')).toEqual(state);
    });
});

describe('buildRequest', () => {
    it('senza genere usa l’endpoint dedicato della scheda', () => {
        expect(buildRequest('movie', { list: 'now_playing', genre: null }, NOW)).toEqual({ endpoint: '/movie/now_playing', params: {} });
        expect(buildRequest('tv', { list: 'airing_today', genre: null }, NOW)).toEqual({ endpoint: '/tv/airing_today', params: {} });
    });

    it('con un genere passa a /discover con criteri equivalenti', () => {
        expect(buildRequest('movie', { list: 'top_rated', genre: 16 }, NOW)).toEqual({
            endpoint: '/discover/movie',
            params: { sort_by: 'vote_average.desc', 'vote_count.gte': 1000, with_genres: 16 },
        });
    });

    it('"In sala" e "In arrivo" usano finestre di date in Italia', () => {
        const nowPlaying = buildRequest('movie', { list: 'now_playing', genre: 28 }, NOW).params;
        expect(nowPlaying).toMatchObject({ region: 'IT', 'release_date.gte': '2026-09-01', 'release_date.lte': '2026-10-16' });

        const upcoming = buildRequest('movie', { list: 'upcoming', genre: 28 }, NOW).params;
        expect(upcoming['release_date.gte']).toBe('2026-10-17');
    });

    it('le serie "In onda" coprono la settimana, "Oggi in TV" solo oggi', () => {
        expect(buildRequest('tv', { list: 'on_the_air', genre: 18 }, NOW).params)
            .toMatchObject({ 'air_date.gte': '2026-10-16', 'air_date.lte': '2026-10-23' });
        expect(buildRequest('tv', { list: 'airing_today', genre: 18 }, NOW).params)
            .toMatchObject({ 'air_date.gte': '2026-10-16', 'air_date.lte': '2026-10-16' });
    });

    it('ogni scheda ha un’etichetta e criteri per /discover', () => {
        for (const lists of Object.values(CATALOGS)) {
            for (const list of lists) {
                expect(list.label).toBeTruthy();
                expect(list.discover(NOW)).toHaveProperty('sort_by');
            }
        }
    });
});
