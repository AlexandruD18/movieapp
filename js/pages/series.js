const initSeries = async () => {
    const popularGrid = document.getElementById('popular-series-grid');
    const onTheAirGrid = document.getElementById('on-the-air-grid');

    /* serie popolari */
    showLoading(popularGrid);
    try {
        const popularSeries = await getPopularSeries();
        renderCards(popularGrid, popularSeries, 'tv');
    } catch (error) {
        showError(popularGrid, 'Impossibile caricare le serie popolari.');
    }

    /* serie in onda */
    showLoading(onTheAirGrid);
    try {
        const onTheAir = await getOnTheAirSeries();
        renderCards(onTheAirGrid, onTheAir, 'tv');
    } catch (error) {
        showError(onTheAirGrid, 'Impossibile caricare le serie in onda.');
    }
};

document.addEventListener('DOMContentLoaded', initSeries);