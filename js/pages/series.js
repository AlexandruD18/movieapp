import { getOnTheAirSeries, getPopularSeries } from '../api.js';
import { initLayout } from '../layout.js';
import { initPagedGrid } from '../utils.js';

initLayout();

/* serie popolari */
initPagedGrid({
    container: document.getElementById('popular-series-grid'),
    button: document.getElementById('popular-series-more'),
    fetchPage: getPopularSeries,
    type: 'tv',
});

/* serie in onda */
initPagedGrid({
    container: document.getElementById('on-the-air-grid'),
    button: document.getElementById('on-the-air-more'),
    fetchPage: getOnTheAirSeries,
    type: 'tv',
});
