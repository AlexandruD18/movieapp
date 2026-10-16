import { ApiError, getImageUrl } from './api.js';

/* formattazione */
export const extractYear = (dateString) => (dateString ? dateString.slice(0, 4) : 'N/D');

export const getTitle = (item) => item.title || item.name || 'Titolo sconosciuto';

export const getReleaseDate = (item) => item.release_date || item.first_air_date;

export const truncate = (text = '', max = 120) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

export const getStarRating = (voteAverage) => {
    const activeStars = Math.round(voteAverage / 2);
    return '★'.repeat(activeStars) + '☆'.repeat(5 - activeStars);
};

export const formatRuntime = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours ? `${hours}h ${String(rest).padStart(2, '0')}m` : `${rest}m`;
};

export const getErrorMessage = (error) => {
    if (error instanceof ApiError) return error.message;
    console.error(error);
    return 'Si è verificato un errore imprevisto.';
};

export const debounce = (callback, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
    };
};

/* DOM */
export const createElement = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

export const createButton = (className, text, onClick) => {
    const button = createElement('button', className, text);
    button.type = 'button';
    if (onClick) button.addEventListener('click', onClick);
    return button;
};

/* card film/serie: il click è gestito con event delegation in layout.js */
export const createCard = (item, type = 'movie') => {
    const title = getTitle(item);
    const year = extractYear(getReleaseDate(item));

    const card = createElement('article', 'card');
    card.dataset.id = item.id;
    card.dataset.type = item.media_type || type;
    card.tabIndex = 0;
    card.setAttribute('role', 'button'); // il nome accessibile è il testo visibile: titolo, anno, voto

    const imageWrapper = createElement('div', 'card_img-container');
    const posterUrl = getImageUrl(item.poster_path, 'w342');

    if (posterUrl) {
        const posterImg = new Image(342, 513);
        posterImg.src = posterUrl;
        posterImg.srcset = `${getImageUrl(item.poster_path, 'w185')} 185w, ${posterUrl} 342w`;
        posterImg.sizes = '(max-width: 600px) 45vw, 180px';
        posterImg.alt = '';
        posterImg.className = 'card_img';
        posterImg.loading = 'lazy';
        posterImg.decoding = 'async';
        // se l'immagine non arriva, meglio un riquadro col titolo che un'icona rotta
        posterImg.addEventListener('error', () => posterImg.replaceWith(createElement('div', 'card_placeholder', title)), { once: true });
        imageWrapper.append(posterImg);
    } else {
        imageWrapper.append(createElement('div', 'card_placeholder', title));
    }

    const rating = createElement('span', 'card_rating', getStarRating(item.vote_average || 0));
    rating.setAttribute('aria-hidden', 'true');

    const meta = createElement('div', 'card_meta');
    meta.append(
        createElement('span', 'card_year', year),
        rating,
        createElement('span', 'card_vote', item.vote_average ? item.vote_average.toFixed(1) : 'N/D'),
    );

    // anteprima visiva della trama: chi usa un lettore di schermo la trova completa nel dettaglio
    const overview = createElement('p', 'card_overview', truncate(item.overview, 120));
    overview.setAttribute('aria-hidden', 'true');

    const overlay = createElement('div', 'card_overlay');
    overlay.append(
        createElement('h3', 'card_title', title),
        meta,
        overview,
    );

    card.append(imageWrapper, overlay);
    return card;
};

export const createStatus = (message, className = '') => {
    const box = createElement('div', `status ${className}`.trim());
    box.append(createElement('p', 'status_text', message));
    return box;
};

export const renderCards = (container, items, type = 'movie', { append = false } = {}) => {
    if (!container) return;
    container.removeAttribute('aria-busy');

    if (!append && items.length === 0) {
        container.replaceChildren(createStatus('Nessun risultato trovato.'));
        return;
    }

    const cards = items.map((item) => createCard(item, type));
    if (append) container.append(...cards);
    else container.replaceChildren(...cards);
};

/* stati di caricamento ed errore */
export const showSkeleton = (container, count = 8) => {
    if (!container) return;
    container.setAttribute('aria-busy', 'true');
    container.replaceChildren(...Array.from({ length: count }, () => createElement('div', 'card card-skeleton')));
};

export const showError = (container, message = 'Errore nel caricamento.', onRetry) => {
    if (!container) return;
    container.removeAttribute('aria-busy');

    const box = createStatus(message, 'status-error');
    box.setAttribute('role', 'alert');
    if (onRetry) box.append(createButton('btn btn-secondary', 'Riprova', onRetry));
    container.replaceChildren(box);
};

/* carica una lista dentro un contenitore con skeleton, errore e "Riprova" */
export const loadSection = async (container, loader, type = 'movie', skeletonCount = 8) => {
    if (!container) return null;
    showSkeleton(container, skeletonCount);

    try {
        const data = await loader();
        renderCards(container, data.results, type);
        return data;
    } catch (error) {
        showError(container, getErrorMessage(error), () => loadSection(container, loader, type, skeletonCount));
        return null;
    }
};

/* griglia paginata con pulsante "Carica altri" */
export const initPagedGrid = ({ container, button, fetchPage, type }) => {
    if (!container || !button) return;

    let page = 0;
    const seen = new Set();

    const loadNext = async () => {
        const isFirst = page === 0;
        if (isFirst) showSkeleton(container, 12);
        button.disabled = true;
        button.textContent = 'Caricamento…';

        try {
            const data = await fetchPage(page + 1);
            page = data.page;

            // TMDB a volte ripete lo stesso titolo su pagine diverse
            const fresh = data.results.filter((item) => !seen.has(item.id));
            fresh.forEach((item) => seen.add(item.id));

            renderCards(container, fresh, type, { append: !isFirst });
            button.textContent = 'Carica altri';
            button.hidden = page >= data.totalPages;
        } catch (error) {
            if (isFirst) {
                showError(container, getErrorMessage(error), loadNext);
                button.hidden = true;
            } else {
                button.textContent = 'Errore: riprova';
            }
        } finally {
            button.disabled = false;
        }
    };

    button.addEventListener('click', loadNext);
    loadNext();
};
