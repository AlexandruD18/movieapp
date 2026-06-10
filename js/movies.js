const initMovies = async () => {
    const popularGrid = document.getElementById('popular-movies-grid');
    const nowPlayingGrid = document.getElementById('now-playing-grid');

    /* film popolari */
    showLoading(popularGrid);
    try {
        const popularMovies = await getPopularMovies();
        renderCards(popularGrid, popularMovies, 'movie');
    } catch (error) {
        showError(popularGrid, 'Impossibile caricare i film popolari.');
    }

    /* film in sala */
    showLoading(nowPlayingGrid);
    try {
        const nowPlaying = await getNowPlayingMovies();
        renderCards(nowPlayingGrid, nowPlaying, 'movie');
    } catch (error) {
        showError(nowPlayingGrid, 'Impossibile caricare i film in sala.');
    }
};

document.addEventListener('DOMContentLoaded', initMovies);