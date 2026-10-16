import { loadApiKey } from './config-loader.js';

/* configurazione api TMDB */
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p';
const LANGUAGE = 'it-IT';
const PLACEHOLDER_KEY = 'LA_TUA_API_KEY';

const STATUS_MESSAGES = {
    401: 'API key TMDB non valida.',
    404: 'Contenuto non trovato.',
    429: 'Troppe richieste: riprova tra qualche secondo.',
};

/* errore con un messaggio già pronto da mostrare all'utente */
export class ApiError extends Error {
    constructor(message, status = 0) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

/* se config.js manca l'app mostra un errore chiaro invece di rompersi */
let apiKeyPromise = null;
const getApiKey = () => {
    apiKeyPromise ??= loadApiKey();
    return apiKeyPromise;
};

/* cache delle richieste: la stessa URL viene scaricata una sola volta per pagina */
const cache = new Map();

/**
 * @param {string} endpoint
 * @param {object} params
 * @returns {Promise<object>}
 */
export const fetchTMDB = async (endpoint, params = {}) => {
    const apiKey = await getApiKey();
    if (!apiKey || apiKey === PLACEHOLDER_KEY) {
        throw new ApiError('API key mancante: copia js/config.example.js in js/config.js e inserisci la tua chiave TMDB.');
    }

    const query = new URLSearchParams({ api_key: apiKey, language: LANGUAGE, ...params });
    const url = `${BASE_URL}${endpoint}?${query}`;

    if (!cache.has(url)) {
        const request = fetch(url)
            .catch(() => {
                throw new ApiError('Connessione assente: controlla la rete e riprova.');
            })
            .then((response) => {
                if (!response.ok) {
                    const message = STATUS_MESSAGES[response.status] ?? `Errore del server TMDB (${response.status}).`;
                    throw new ApiError(message, response.status);
                }
                return response.json();
            });

        // gli errori non restano in cache, così "Riprova" rifà davvero la richiesta
        request.catch(() => cache.delete(url));
        cache.set(url, request);
    }

    return cache.get(url);
};

/**
 * @param {string|null} path
 * @param {string} size
 * @returns {string|null}
 */
export const getImageUrl = (path, size = 'w342') => (path ? `${IMG_BASE_URL}/${size}${path}` : null);

/* liste paginate: risultati + info per il "Carica altri" */
const getList = async (endpoint, params = {}) => {
    const data = await fetchTMDB(endpoint, params);
    return {
        results: data.results ?? [],
        page: data.page ?? 1,
        totalPages: data.total_pages ?? 1,
    };
};

/* funzioni per endpoint */
export const getTrending = (type) => getList(`/trending/${type}/day`);

export const getTopRatedMovies = (page = 1) => getList('/movie/top_rated', { page });

export const getPopularMovies = (page = 1) => getList('/movie/popular', { page });

export const getNowPlayingMovies = (page = 1) => getList('/movie/now_playing', { page });

export const getPopularSeries = (page = 1) => getList('/tv/popular', { page });

export const getOnTheAirSeries = (page = 1) => getList('/tv/on_the_air', { page });

/* dettaglio + cast + trailer + piattaforme + consigliati in una sola richiesta */
export const getDetail = (type, id) => fetchTMDB(`/${type}/${id}`, {
    append_to_response: 'credits,videos,watch/providers,recommendations',
    include_video_language: 'it,en',
});

export const searchMulti = async (query) => {
    const { results } = await getList('/search/multi', { query, include_adult: 'false' });
    return results.filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
};
