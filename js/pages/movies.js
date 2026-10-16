import { getNowPlayingMovies, getPopularMovies } from '../api.js';
import { initLayout } from '../layout.js';
import { initPagedGrid } from '../utils.js';

initLayout();

/* film popolari */
initPagedGrid({
    container: document.getElementById('popular-movies-grid'),
    button: document.getElementById('popular-movies-more'),
    fetchPage: getPopularMovies,
    type: 'movie',
});

/* film in sala */
initPagedGrid({
    container: document.getElementById('now-playing-grid'),
    button: document.getElementById('now-playing-more'),
    fetchPage: getNowPlayingMovies,
    type: 'movie',
});
