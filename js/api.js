/* configurazione keys api */
const API_KEY = '59419b0dbb685c06b675d07744aca952';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p';
const LANGUAGE = 'it-IT';

/* creazione url */

/**
 * @param {string|null} posterPath
 * @param {string} size
 * @returns {string}
*/
const getImageUrl = (posterPath, size = 'w300') => {
    if (!posterPath) return null;
    return `${IMG_BASE_URL}/${size}${posterPath}`;
}

/**
 * @param {string|null} backdropPath
 * @returns {string}
*/
const getBackdropUrl = (backdropPath) => {
    if (!backdropPath) return null;
    return `${IMG_BASE_URL}/w780${backdropPath}`;
}

/**
 * @param {string} endpoint
 * @param {object} params
 * @returns {Promise<object>}
*/
const fetchTMDB = async (endpoint, params = {}) => {
    const queryParams = new URLSearchParams({api_key: API_KEY, language: LANGUAGE, ...params});
    const url = `${BASE_URL}${endpoint}?${queryParams.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data from TMDB:', error);
        throw error;
    }
}

/* funzioni per endpoint */
const getTrendingMovies = async () => {
    const data = await fetchTMDB('/trending/movie/day');
    return data.results;
}

const getTrendingSeries = async () => {
    const data = await fetchTMDB('/trending/tv/day');
    return data.results;
}

const getPopularMovies = async (page = 1) => {
    const data = await fetchTMDB('/movie/popular', { page });
    return data.results;
}

const getNowPlayingMovies = async (page = 1) => {
    const data = await fetchTMDB('/movie/now_playing', { page });
    return data.results;
}

const getPopularSeries = async (page = 1) => {
    const data = await fetchTMDB('/tv/popular', { page });
    return data.results;
}

const getOnTheAirSeries = async (page = 1) => {
    const data = await fetchTMDB('/tv/on_the_air', { page });
    return data.results;
}

const getMovieDetail = async (movieId) => {
    const data = await fetchTMDB(`/movie/${movieId}`);
    return data;
}

const searchMulti = async (query, page = 1) => {
    const data = await fetchTMDB('/search/multi', { query, page });
    return data.results.filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
}

const searchMovies = async (query, page = 1) => {
    const data = await fetchTMDB('/search/movie', { query, page });
    return data.results;
}

const searchSeries = async (query, page = 1) => {
    const data = await fetchTMDB('/search/tv', { query, page });
    return data.results;
}

const getTopRatedMovies = async (page = 1) => {
    const data = await fetchTMDB('/movie/top_rated', { page });
    return data.results;
}