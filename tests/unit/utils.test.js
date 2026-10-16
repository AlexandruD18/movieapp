import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    createCard,
    debounce,
    extractYear,
    formatRuntime,
    getStarRating,
    getTitle,
    renderCards,
    truncate,
} from '../../js/utils.js';

describe('formattazione', () => {
    it('extractYear', () => {
        expect(extractYear('2010-07-15')).toBe('2010');
        expect(extractYear('')).toBe('N/D');
        expect(extractYear(undefined)).toBe('N/D');
    });

    it('getTitle usa title per i film e name per le serie', () => {
        expect(getTitle({ title: 'Inception' })).toBe('Inception');
        expect(getTitle({ name: 'Breaking Bad' })).toBe('Breaking Bad');
        expect(getTitle({})).toBe('Titolo sconosciuto');
    });

    it('truncate taglia solo i testi lunghi', () => {
        expect(truncate('breve', 10)).toBe('breve');
        expect(truncate('una frase decisamente lunga', 10)).toBe('una frase…');
        expect(truncate(undefined, 10)).toBe('');
    });

    it('getStarRating converte il voto su 10 in 5 stelle', () => {
        expect(getStarRating(8.4)).toBe('★★★★☆');
        expect(getStarRating(0)).toBe('☆☆☆☆☆');
        expect(getStarRating(10)).toBe('★★★★★');
    });

    it('formatRuntime', () => {
        expect(formatRuntime(148)).toBe('2h 28m');
        expect(formatRuntime(120)).toBe('2h 00m');
        expect(formatRuntime(45)).toBe('45m');
        expect(formatRuntime(0)).toBeNull();
    });
});

describe('debounce', () => {
    afterEach(() => vi.useRealTimers());

    it('esegue solo l’ultima chiamata dopo la pausa', () => {
        vi.useFakeTimers();
        const callback = vi.fn();
        const debounced = debounce(callback, 300);

        debounced('a');
        debounced('ab');
        debounced('abc');
        vi.advanceTimersByTime(299);
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith('abc');
    });
});

describe('card', () => {
    const movie = {
        id: 27205,
        title: 'Inception',
        poster_path: '/poster.jpg',
        release_date: '2010-07-15',
        vote_average: 8.4,
        overview: 'Un ladro che ruba segreti dai sogni.',
    };

    it('createCard è un pulsante raggiungibile da tastiera con poster responsive', () => {
        const card = createCard(movie, 'movie');

        expect(card.dataset).toMatchObject({ id: '27205', type: 'movie' });
        expect(card.getAttribute('role')).toBe('button');
        expect(card.tabIndex).toBe(0);
        expect(card.querySelector('.card_title').textContent).toBe('Inception');
        expect(card.querySelector('.card_overview').getAttribute('aria-hidden')).toBe('true');
        expect(card.querySelector('.card_img').src).toBe('https://image.tmdb.org/t/p/w342/poster.jpg');
        expect(card.querySelector('.card_img').srcset).toContain('w185/poster.jpg 185w');
        expect(card.querySelector('.card_vote').textContent).toBe('8.4');
    });

    it('usa media_type quando presente (risultati misti)', () => {
        expect(createCard({ ...movie, media_type: 'tv' }, 'movie').dataset.type).toBe('tv');
    });

    it('senza poster mostra un riquadro col titolo', () => {
        const card = createCard({ ...movie, poster_path: null });
        expect(card.querySelector('img')).toBeNull();
        expect(card.querySelector('.card_placeholder').textContent).toBe('Inception');
    });

    it('se il poster non si carica lo sostituisce col riquadro', () => {
        const card = createCard(movie);
        card.querySelector('img').dispatchEvent(new Event('error'));
        expect(card.querySelector('.card_placeholder')).not.toBeNull();
    });

    it('renderCards sostituisce o accoda', () => {
        const container = document.createElement('div');
        renderCards(container, [movie, { ...movie, id: 2 }]);
        expect(container.children).toHaveLength(2);

        renderCards(container, [{ ...movie, id: 3 }], 'movie', { append: true });
        expect(container.children).toHaveLength(3);

        renderCards(container, []);
        expect(container.textContent).toContain('Nessun risultato');
    });
});
