/*
 * Registra risposte reali di TMDB come fixture per i test end-to-end,
 * così i test non dipendono da rete, chiave API o dati che cambiano ogni giorno.
 *
 *   TMDB_API_KEY=xxx node scripts/record-fixtures.js
 *   (oppure senza variabile, se esiste js/config.js)
 */
import { mkdir, writeFile } from 'node:fs/promises';

const OUT_DIR = new URL('../tests/e2e/fixtures/', import.meta.url);
const LIST_SIZE = 10;

const getKey = async () => {
    if (process.env.TMDB_API_KEY) return process.env.TMDB_API_KEY;
    try {
        return (await import('../js/config.js')).TMDB_API_KEY;
    } catch {
        throw new Error('Imposta TMDB_API_KEY o crea js/config.js');
    }
};

const apiKey = await getKey();

const get = async (endpoint, params = {}) => {
    const query = new URLSearchParams({ api_key: apiKey, language: 'it-IT', ...params });
    const response = await fetch(`https://api.themoviedb.org/3${endpoint}?${query}`);
    if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`);
    return response.json();
};

const pick = (object, keys) => Object.fromEntries(keys.filter((key) => key in object).map((key) => [key, object[key]]));

const LIST_FIELDS = ['id', 'title', 'name', 'media_type', 'poster_path', 'backdrop_path', 'release_date', 'first_air_date', 'vote_average', 'overview'];

const trimList = (data) => ({
    page: 1,
    total_pages: 3, // abbastanza per provare "Carica altri"
    total_results: data.total_results,
    results: data.results.slice(0, LIST_SIZE).map((item) => pick(item, LIST_FIELDS)),
});

const trimDetail = (data) => ({
    ...data,
    production_companies: undefined,
    production_countries: undefined,
    spoken_languages: undefined,
    credits: {
        cast: data.credits.cast.slice(0, 6).map((person) => pick(person, ['name', 'character', 'profile_path'])),
        crew: data.credits.crew.filter((person) => person.job === 'Director').map((person) => pick(person, ['name', 'job'])),
    },
    videos: { results: data.videos.results.filter((video) => video.site === 'YouTube').slice(0, 3) },
    'watch/providers': { results: pick(data['watch/providers'].results, ['IT']) },
    recommendations: { results: data.recommendations.results.slice(0, 6).map((item) => pick(item, LIST_FIELDS)) },
});

const DETAIL_PARAMS = { append_to_response: 'credits,videos,watch/providers,recommendations', include_video_language: 'it,en' };

const fixtures = {
    'trending-movie-day': trimList(await get('/trending/movie/day')),
    'trending-tv-day': trimList(await get('/trending/tv/day')),
    'movie-top_rated': trimList(await get('/movie/top_rated')),
    'movie-popular': trimList(await get('/movie/popular')),
    'movie-now_playing': trimList(await get('/movie/now_playing')),
    'movie-upcoming': trimList(await get('/movie/upcoming')),
    'tv-popular': trimList(await get('/tv/popular')),
    'tv-on_the_air': trimList(await get('/tv/on_the_air')),
    'tv-top_rated': trimList(await get('/tv/top_rated')),
    'tv-airing_today': trimList(await get('/tv/airing_today')),
    'discover-movie': trimList(await get('/discover/movie', { with_genres: 16, sort_by: 'popularity.desc' })),
    'discover-tv': trimList(await get('/discover/tv', { with_genres: 16, sort_by: 'popularity.desc' })),
    'genre-movie-list': await get('/genre/movie/list'),
    'genre-tv-list': await get('/genre/tv/list'),
    'search-multi': trimList(await get('/search/multi', { query: 'inception' })),
    'movie-detail': trimDetail(await get('/movie/27205', DETAIL_PARAMS)),
    'tv-detail': trimDetail(await get('/tv/1396', DETAIL_PARAMS)),
};

await mkdir(OUT_DIR, { recursive: true });
for (const [name, data] of Object.entries(fixtures)) {
    await writeFile(new URL(`${name}.json`, OUT_DIR), `${JSON.stringify(data, null, 2)}\n`);
    console.log(`✓ ${name}.json`);
}
