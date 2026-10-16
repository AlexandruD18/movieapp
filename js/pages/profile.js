import { getFavorites, onFavoritesChange } from '../favorites.js';
import { initLayout } from '../layout.js';
import { createStatus, renderCards } from '../utils.js';

const FILTERS = {
    all: () => true,
    movie: (item) => item.media_type === 'movie',
    tv: (item) => item.media_type === 'tv',
};

let activeFilter = 'all';

/* statistiche calcolate dalla lista reale */
const renderStats = (favorites) => {
    const movies = favorites.filter(FILTERS.movie).length;
    const rated = favorites.filter((item) => item.vote_average);
    const average = rated.length
        ? (rated.reduce((sum, item) => sum + item.vote_average, 0) / rated.length).toFixed(1)
        : '–';
    const minutes = favorites.reduce((sum, item) => sum + (item.runtime || 0), 0);

    document.getElementById('stat-movies').textContent = movies;
    document.getElementById('stat-series').textContent = favorites.length - movies;
    document.getElementById('stat-average').textContent = average;
    document.getElementById('stat-hours').textContent = Math.round(minutes / 60);
};

const renderList = () => {
    const favorites = getFavorites();
    const grid = document.getElementById('favorites-grid');
    const empty = document.getElementById('favorites-empty');
    const visible = favorites.filter(FILTERS[activeFilter]);

    renderStats(favorites);
    empty.hidden = favorites.length > 0;
    grid.hidden = favorites.length === 0;

    if (favorites.length > 0 && visible.length === 0) {
        grid.replaceChildren(createStatus('Nessun titolo in questa categoria.'));
    } else {
        renderCards(grid, visible);
    }
};

const initFilters = () => {
    const buttons = document.querySelectorAll('[data-filter]');
    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            activeFilter = button.dataset.filter;
            buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
            renderList();
        });
    });
};

initLayout();
initFilters();
renderList();

// si aggiorna se tolgo un titolo dal modale o da un'altra scheda
onFavoritesChange(renderList);
