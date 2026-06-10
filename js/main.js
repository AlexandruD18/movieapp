let heroMovies = [];

/* dati film hero */
const renderHero = (movie) => {
    const backdrop = document.getElementById('hero-backdrop');
    const title = document.getElementById('hero-title');
    const overview = document.getElementById('hero-overview');
    const meta = document.getElementById('hero-meta');

    const backdropUrl = getBackdropUrl(movie.backdrop_path);
    if (backdropUrl) {
        backdrop.style.backgroundImage = `url(${backdropUrl})`;
    }

    // titolo
    title.textContent = movie.title || movie.name || 'Titolo sconosciuto';

    // overview
    const overviewText = movie.overview || '';
    overview.textContent = overviewText.length > 200
        ? overviewText.substring(0, 200) + '…'
        : overviewText;

    meta.innerHTML = '';

    const year = extractYear(movie.release_date || movie.first_air_date);
    if (year !== 'N/D') {
        const yearBadge = document.createElement('span');
        yearBadge.classList.add('hero_badge');
        yearBadge.textContent = year;
        meta.appendChild(yearBadge);
    }

    if (movie.vote_average) {
        const voteBadge = document.createElement('span');
        voteBadge.classList.add('hero_badge', 'hero_badge-accent');
        voteBadge.textContent = movie.vote_average.toFixed(1);
        meta.appendChild(voteBadge);
    }

    const trendBadge = document.createElement('span');
    trendBadge.classList.add('hero_badge', 'hero_badge-glow');
    trendBadge.textContent = 'Trending';
    meta.appendChild(trendBadge);
}

/* scroll orizzontale */
const initScrollRow = (rowId) => {
    const row = document.getElementById(rowId);
    if (!row) return;

    const track = row.querySelector('.scroll-row_track');
    const leftBtn = row.querySelector('.scroll-row_btn-left');
    const rightBtn = row.querySelector('.scroll-row_btn-right');

    const scrollAmount = () => track.clientWidth * 0.75;

    leftBtn.addEventListener('click', () => {
        track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });

    rightBtn.addEventListener('click', () => {
        track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });
}

/* home page */
const initHome = async () => {
    const trendingMoviesGrid = document.getElementById('trending-movies-grid');
    const trendingSeriesGrid = document.getElementById('trending-series-grid');
    const topRatedGrid = document.getElementById('top-rated-grid');

    try {
        heroMovies = await getTrendingMovies();
        if (heroMovies.length > 0) {
            const withBackdrop = heroMovies.filter((m) => m.backdrop_path);
            if (withBackdrop.length > 0) {
                heroMovies = withBackdrop;
            }
            renderHero(heroMovies[0]);
        }
    } catch (error) {
        console.error('Errore caricamento hero:', error);
    }

    /* film trending */
    showLoading(trendingMoviesGrid);
    try {
        const movies = await getTrendingMovies();
        renderCards(trendingMoviesGrid, movies, 'movie');
        initScrollRow('trending-movies-row');
    } catch (error) {
        showError(trendingMoviesGrid, 'Errore caricamento film trending');
        console.error('Errore caricamento film trending:', error);
    }

    /* serie trending */
    showLoading(trendingSeriesGrid);
    try {
        const series = await getTrendingSeries();
        renderCards(trendingSeriesGrid, series, 'tv');
        initScrollRow('trending-series-row');
    } catch (error) {
        showError(trendingSeriesGrid, 'Errore caricamento serie trending');
        console.error('Errore caricamento serie trending:', error);
    }

    /* top rated */
    showLoading(topRatedGrid);
    try {
        const topRated = await getTopRatedMovies();
        renderCards(topRatedGrid, topRated, 'movie');
    } catch (error) {
        showError(topRatedGrid, 'Errore caricamento top rated');
        console.error('Errore caricamento top rated:', error);
    }
};

document.addEventListener('DOMContentLoaded', initHome);