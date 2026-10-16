import { getReleaseDate, getTitle } from './utils.js';

/* "La mia lista": salvata nel localStorage del browser, niente account né backend */
const STORAGE_KEY = 'movieapp:favorites';
const CHANGE_EVENT = 'favorites:change';

const read = () => {
    try {
        const list = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
};

let favorites = read();

const save = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
        // storage disabilitato o pieno: la lista resta valida fino alla chiusura della pagina
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
};

/* modifiche fatte in un'altra scheda */
window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    favorites = read();
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
});

/* durata totale in minuti: per le serie è una stima (durata episodio × episodi) */
const getTotalRuntime = (type, detail) => {
    if (type === 'movie') return detail.runtime || 0;
    const episodeRuntime = detail.episode_run_time?.[0] || 0;
    return episodeRuntime * (detail.number_of_episodes || 0);
};

export const getFavorites = () => [...favorites];

export const isFavorite = (type, id) => favorites.some((item) => item.media_type === type && item.id === id);

export const onFavoritesChange = (callback) => window.addEventListener(CHANGE_EVENT, callback);

/**
 * @param {'movie'|'tv'} type
 * @param {object} detail risposta di /movie/{id} o /tv/{id}
 * @returns {boolean} true se ora è nella lista
 */
export const toggleFavorite = (type, detail) => {
    if (isFavorite(type, detail.id)) {
        favorites = favorites.filter((item) => !(item.media_type === type && item.id === detail.id));
    } else {
        favorites = [{
            id: detail.id,
            media_type: type,
            title: getTitle(detail),
            poster_path: detail.poster_path,
            release_date: getReleaseDate(detail),
            vote_average: detail.vote_average,
            overview: detail.overview,
            runtime: getTotalRuntime(type, detail),
            added_at: Date.now(),
        }, ...favorites];
    }

    save();
    return isFavorite(type, detail.id);
};
