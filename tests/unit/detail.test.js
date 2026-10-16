import { describe, expect, it } from 'vitest';
import {
    findTrailer,
    formatDate,
    formatMoney,
    getFacts,
    getLanguageName,
    getScoreLevel,
    getStatusLabel,
    groupProviders,
    renderDetail,
} from '../../js/detail.js';
import { parseDetailHash } from '../../js/modal.js';

describe('formattazione del dettaglio', () => {
    it('formatDate in italiano, senza slittamenti di fuso orario', () => {
        expect(formatDate('2010-07-15')).toBe('15 luglio 2010');
        expect(formatDate('')).toBeNull();
        expect(formatDate('non una data')).toBeNull();
    });

    it('getLanguageName', () => {
        expect(getLanguageName('en')).toBe('Inglese');
        expect(getLanguageName('ja')).toBe('Giapponese');
        expect(getLanguageName(null)).toBeNull();
    });

    it('getStatusLabel traduce gli stati noti e lascia gli altri', () => {
        expect(getStatusLabel('Returning Series')).toBe('In corso');
        expect(getStatusLabel('Qualcosa di nuovo')).toBe('Qualcosa di nuovo');
    });

    it('formatMoney in forma compatta, senza decimali inutili, null se assente', () => {
        expect(formatMoney(160000000)).toMatch(/^160\s?Mln/);
        expect(formatMoney(839030630)).toMatch(/^839\s?Mln/);
        expect(formatMoney(1250000)).toMatch(/^1,3\s?Mln/);
        expect(formatMoney(0)).toBeNull();
    });

    it('getScoreLevel', () => {
        expect(getScoreLevel(8.4)).toBe('high');
        expect(getScoreLevel(6)).toBe('mid');
        expect(getScoreLevel(3.2)).toBe('low');
    });
});

describe('findTrailer', () => {
    const video = (overrides) => ({ site: 'YouTube', type: 'Trailer', official: false, key: 'x', ...overrides });

    it('preferisce il trailer ufficiale', () => {
        const videos = [video({ type: 'Teaser', key: 'teaser' }), video({ key: 'fan' }), video({ official: true, key: 'ufficiale' })];
        expect(findTrailer(videos).key).toBe('ufficiale');
    });

    it('ripiega su teaser e ignora altre piattaforme', () => {
        expect(findTrailer([video({ site: 'Vimeo' }), video({ type: 'Teaser', key: 't' })]).key).toBe('t');
        expect(findTrailer([])).toBeNull();
        expect(findTrailer(undefined)).toBeNull();
    });
});

describe('groupProviders', () => {
    it('raggruppa per tipo di offerta in ordine di priorità', () => {
        const groups = groupProviders({
            buy: [{ provider_name: 'Apple TV', display_priority: 2 }],
            flatrate: [
                { provider_name: 'Sky', display_priority: 5 },
                { provider_name: 'Netflix', display_priority: 1 },
            ],
        });

        expect(groups.map((group) => group.label)).toEqual(['In abbonamento', 'Acquisto']);
        expect(groups[0].providers.map((provider) => provider.provider_name)).toEqual(['Netflix', 'Sky']);
    });

    it('nessun dato per l’Italia = nessun gruppo', () => {
        expect(groupProviders(undefined)).toEqual([]);
    });
});

describe('getFacts', () => {
    it('film: regia, date, soldi; salta i campi vuoti', () => {
        const facts = Object.fromEntries(getFacts('movie', {
            title: 'Inception',
            original_title: 'Inception',
            release_date: '2010-07-15',
            runtime: 148,
            status: 'Released',
            budget: 0,
            credits: { crew: [{ job: 'Director', name: 'Christopher Nolan' }, { job: 'Producer', name: 'Emma Thomas' }] },
        }));

        expect(facts).toMatchObject({ Regia: 'Christopher Nolan', Uscita: '15 luglio 2010', Durata: '2h 28m', Stato: 'Uscito' });
        expect(facts).not.toHaveProperty('Budget');
        expect(facts).not.toHaveProperty('Titolo originale'); // uguale al titolo
    });

    it('serie: autori, rete e prossimo episodio', () => {
        const facts = Object.fromEntries(getFacts('tv', {
            name: 'La casa di carta',
            original_name: 'La casa de papel',
            created_by: [{ name: 'Álex Pina' }],
            networks: [{ name: 'Antena 3' }, { name: 'Netflix' }],
            next_episode_to_air: { season_number: 2, episode_number: 5, air_date: '2026-11-12' },
        }));

        expect(facts).toMatchObject({
            'Ideata da': 'Álex Pina',
            Rete: 'Antena 3, Netflix',
            'Prossimo episodio': 'S2 E5 · 12 novembre 2026',
            'Titolo originale': 'La casa de papel',
        });
    });
});

describe('renderDetail', () => {
    const detail = {
        id: 1396,
        name: 'Breaking Bad',
        first_air_date: '2008-01-20',
        vote_average: 8.9,
        vote_count: 18000,
        number_of_seasons: 5,
        genres: [{ id: 18, name: 'Dramma' }],
        seasons: [
            { season_number: 0, name: 'Speciali', episode_count: 9 },
            { season_number: 1, name: 'Stagione 1', episode_count: 7, air_date: '2008-01-20' },
        ],
        credits: { cast: [{ name: 'Bryan Cranston', character: 'Walter White' }] },
        recommendations: { results: [{ id: 60059, name: 'Better Call Saul', poster_path: '/p.jpg', media_type: 'tv' }] },
    };

    it('costruisce titolo, voto, stagioni (senza speciali) e consigliati', () => {
        const root = renderDetail('tv', detail);

        expect(root.querySelector('#modal-title').textContent).toBe('Breaking Bad');
        expect(root.querySelector('.score').dataset.level).toBe('high');
        expect(root.querySelectorAll('.season')).toHaveLength(1);
        expect(root.querySelector('.detail_similar .card').dataset).toMatchObject({ id: '60059', type: 'tv' });
        expect(root.textContent).toContain('non risulta disponibile in streaming');
    });

    it('senza trailer non mostra il pulsante', () => {
        const root = renderDetail('tv', detail);
        expect(root.textContent).not.toContain('Guarda il trailer');
    });
});

describe('parseDetailHash', () => {
    it('riconosce solo #movie-123 e #tv-456', () => {
        expect(parseDetailHash('#movie-27205')).toEqual({ type: 'movie', id: 27205 });
        expect(parseDetailHash('#tv-1396')).toEqual({ type: 'tv', id: 1396 });
        expect(parseDetailHash('#main')).toBeNull();
        expect(parseDetailHash('')).toBeNull();
    });
});
