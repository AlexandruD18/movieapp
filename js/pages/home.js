import { getImageUrl, getTopRatedMovies, getTrending } from '../api.js';
import { initLayout } from '../layout.js';
import { openDetail } from '../modal.js';
import { createElement, extractYear, getErrorMessage, getTitle, loadSection, truncate } from '../utils.js';

const HERO_SLIDES = 5;
const HERO_INTERVAL = 8000;
const HERO_FADE = 400;

/* sfondo hero: w780 basta per i telefoni, w1280 per gli schermi grandi */
const createBackdrop = (movie, priority = 'auto') => {
    const img = new Image();
    img.srcset = `${getImageUrl(movie.backdrop_path, 'w780')} 780w, ${getImageUrl(movie.backdrop_path, 'w1280')} 1280w`;
    img.sizes = '100vw';
    img.src = getImageUrl(movie.backdrop_path, 'w1280');
    img.alt = '';
    img.fetchPriority = priority;
    return img;
};

/* dati film hero */
const renderHero = (movie, priority) => {
    const backdrop = document.getElementById('hero-backdrop');
    const title = document.getElementById('hero-title');
    const overview = document.getElementById('hero-overview');
    const meta = document.getElementById('hero-meta');

    backdrop.replaceChildren(createBackdrop(movie, priority));
    title.textContent = getTitle(movie);
    overview.textContent = truncate(movie.overview, 200);

    const badges = [createElement('span', 'badge badge-accent badge-glow', 'In tendenza oggi')];
    const year = extractYear(movie.release_date);
    if (year !== 'N/D') badges.push(createElement('span', 'badge', year));
    if (movie.vote_average) badges.push(createElement('span', 'badge badge-star', `★ ${movie.vote_average.toFixed(1)}`));
    meta.replaceChildren(...badges);
};

/* hero a rotazione tra i film trending con un'immagine di sfondo */
const initHero = async () => {
    const hero = document.getElementById('hero');
    const detailsBtn = document.getElementById('hero-details');

    try {
        const { results } = await getTrending('movie');
        const slides = results.filter((movie) => movie.backdrop_path).slice(0, HERO_SLIDES);
        if (slides.length === 0) return;

        let index = 0;
        renderHero(slides[index], 'high'); // è l'elemento più grande: LCP
        detailsBtn.hidden = false;
        detailsBtn.addEventListener('click', () => openDetail('movie', slides[index].id));

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion || slides.length < 2) return;

        // precarica gli sfondi per evitare il flash durante il cambio
        slides.slice(1).forEach((movie) => createBackdrop(movie, 'low'));

        setInterval(() => {
            // pausa se la scheda non è visibile o l'utente sta interagendo con la hero
            if (document.hidden || hero.matches(':hover, :focus-within')) return;
            index = (index + 1) % slides.length;
            hero.classList.add('hero-transitioning');
            setTimeout(() => {
                renderHero(slides[index]);
                hero.classList.remove('hero-transitioning');
            }, HERO_FADE);
        }, HERO_INTERVAL);
    } catch (error) {
        document.getElementById('hero-title').textContent = 'movieApp';
        document.getElementById('hero-overview').textContent = getErrorMessage(error);
    }
};

/* scroll orizzontale con frecce */
const initScrollRow = (rowId) => {
    const row = document.getElementById(rowId);
    const track = row?.querySelector('.scroll-row_track');
    if (!track) return () => {};

    const prevBtn = row.querySelector('.scroll-row_btn-left');
    const nextBtn = row.querySelector('.scroll-row_btn-right');
    const step = () => track.clientWidth * 0.8;

    const update = () => {
        prevBtn.disabled = track.scrollLeft <= 1;
        nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    };

    prevBtn.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    nextBtn.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return update;
};

initLayout();
initHero();

const updateMoviesRow = initScrollRow('trending-movies-row');
const updateSeriesRow = initScrollRow('trending-series-row');

// le tre sezioni partono in parallelo; la hero riusa la stessa richiesta dei film trending (cache in api.js)
loadSection(document.getElementById('trending-movies-track'), () => getTrending('movie'), 'movie').then(updateMoviesRow);
loadSection(document.getElementById('trending-series-track'), () => getTrending('tv'), 'tv').then(updateSeriesRow);
loadSection(document.getElementById('top-rated-grid'), () => getTopRatedMovies(), 'movie', 12);
