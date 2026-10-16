import { getGenres, getImageUrl, getList } from './api.js';
import { openDetail } from './modal.js';
import {
    createButton,
    createElement,
    createStatus,
    extractYear,
    getErrorMessage,
    getReleaseDate,
    getTitle,
    renderCards,
    showError,
    showSkeleton,
} from './utils.js';

/*
 * Catalogo di film e serie: schede (Popolari, In sala...), filtro per genere,
 * titolo in evidenza e griglia paginata. Lo stato vive nell'URL
 * (movies.html?list=top_rated&genre=28) così una selezione si può condividere.
 */

const DAY = 86_400_000;
const isoDate = (offsetDays = 0, now = Date.now()) => new Date(now + offsetDays * DAY).toISOString().slice(0, 10);

/*
 * Senza genere ogni scheda usa il suo endpoint dedicato; con un genere si passa
 * a /discover con parametri equivalenti, perché gli endpoint dedicati non filtrano.
 */
export const CATALOGS = {
    movie: [
        { id: 'popular', label: 'Popolari', discover: () => ({ sort_by: 'popularity.desc' }) },
        {
            id: 'now_playing',
            label: 'In sala',
            discover: (now) => ({
                sort_by: 'popularity.desc',
                region: 'IT',
                with_release_type: '2|3',
                'release_date.gte': isoDate(-45, now),
                'release_date.lte': isoDate(0, now),
            }),
        },
        { id: 'top_rated', label: 'Più votati', discover: () => ({ sort_by: 'vote_average.desc', 'vote_count.gte': 1000 }) },
        {
            id: 'upcoming',
            label: 'In arrivo',
            discover: (now) => ({
                sort_by: 'popularity.desc',
                region: 'IT',
                with_release_type: '2|3',
                'release_date.gte': isoDate(1, now),
            }),
        },
    ],
    tv: [
        { id: 'popular', label: 'Popolari', discover: () => ({ sort_by: 'popularity.desc' }) },
        {
            id: 'on_the_air',
            label: 'In onda',
            discover: (now) => ({ sort_by: 'popularity.desc', 'air_date.gte': isoDate(0, now), 'air_date.lte': isoDate(7, now) }),
        },
        { id: 'top_rated', label: 'Più votate', discover: () => ({ sort_by: 'vote_average.desc', 'vote_count.gte': 500 }) },
        {
            id: 'airing_today',
            label: 'Oggi in TV',
            discover: (now) => ({ sort_by: 'popularity.desc', 'air_date.gte': isoDate(0, now), 'air_date.lte': isoDate(0, now) }),
        },
    ],
};

const findList = (type, listId) => CATALOGS[type].find((list) => list.id === listId) ?? CATALOGS[type][0];

/* stato <-> URL */
export const parseState = (search, type) => {
    const params = new URLSearchParams(search);
    const genre = params.get('genre');
    return {
        list: findList(type, params.get('list')).id,
        genre: /^\d+$/.test(genre ?? '') ? Number(genre) : null,
    };
};

export const stateToSearch = (state, type) => {
    const params = new URLSearchParams();
    if (state.list !== CATALOGS[type][0].id) params.set('list', state.list);
    if (state.genre) params.set('genre', state.genre);
    const query = params.toString();
    return query ? `?${query}` : '';
};

/* quale richiesta fare per una combinazione scheda + genere */
export const buildRequest = (type, state, now = Date.now()) => {
    const list = findList(type, state.list);
    if (!state.genre) return { endpoint: `/${type}/${list.id}`, params: {} };
    return { endpoint: `/discover/${type}`, params: { ...list.discover(now), with_genres: state.genre } };
};

/* DOM */
const createSpotlight = (item, type, selection) => {
    const card = createElement('article', 'spotlight_card');

    const media = createElement('div', 'spotlight_media');
    const img = new Image();
    img.srcset = `${getImageUrl(item.backdrop_path, 'w780')} 780w, ${getImageUrl(item.backdrop_path, 'w1280')} 1280w`;
    img.sizes = '(max-width: 1400px) 100vw, 1400px';
    img.src = getImageUrl(item.backdrop_path, 'w1280');
    img.alt = '';
    img.fetchPriority = 'high';
    media.append(img);

    const rank = createElement('p', 'spotlight_rank');
    const number = createElement('span', 'spotlight_rank-number', '1');
    number.setAttribute('aria-hidden', 'true');
    const label = createElement('span', 'spotlight_rank-label');
    label.append(createElement('span', 'spotlight_rank-kicker', 'In testa'), createElement('span', 'spotlight_rank-selection', selection));
    rank.append(number, label);

    const title = createElement('h2', 'spotlight_title', getTitle(item));
    title.id = 'spotlight-title';

    const meta = createElement('div', 'spotlight_meta');
    const year = extractYear(getReleaseDate(item));
    if (year !== 'N/D') meta.append(createElement('span', 'badge', year));
    if (item.vote_average) meta.append(createElement('span', 'badge badge-star', `★ ${item.vote_average.toFixed(1)}`));

    const content = createElement('div', 'spotlight_content');
    content.append(rank, title, meta);
    if (item.overview) content.append(createElement('p', 'spotlight_overview', item.overview));
    content.append(createButton('btn btn-primary', 'ⓘ Scopri di più', () => openDetail(type, item.id)));

    card.append(media, content);
    return card;
};

/**
 * @param {'movie'|'tv'} type
 */
export const initCatalog = (type) => {
    const lists = CATALOGS[type];
    const els = {
        header: document.getElementById('catalog-header'),
        tabs: document.getElementById('catalog-tabs'),
        genres: document.getElementById('catalog-genres'),
        spotlight: document.getElementById('spotlight'),
        results: document.getElementById('catalog-results'),
        heading: document.getElementById('catalog-heading'),
        count: document.getElementById('catalog-count'),
        grid: document.getElementById('catalog-grid'),
        more: document.getElementById('catalog-more'),
    };

    let state = parseState(location.search, type);
    let genres = [];
    let page = 0;
    let requestId = 0;
    let seen = new Set();

    const genreName = () => genres.find((genre) => genre.id === state.genre)?.name;
    const selectionLabel = () => [findList(type, state.list).label, genreName()].filter(Boolean).join(' · ');

    const updateControls = () => {
        els.tabs.querySelectorAll('[role="tab"]').forEach((tab) => {
            const active = tab.dataset.list === state.list;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
            if (active) els.results.setAttribute('aria-labelledby', tab.id);
        });
        els.genres.querySelectorAll('[data-genre]').forEach((chip) => {
            chip.setAttribute('aria-pressed', String(Number(chip.dataset.genre) === (state.genre ?? 0)));
        });
        els.heading.textContent = selectionLabel();
    };

    const showSpotlightSkeleton = () => {
        els.spotlight.hidden = false;
        els.spotlight.classList.add('spotlight-loading');
        els.spotlight.replaceChildren(createElement('div', 'spotlight_card'));
    };

    const loadPage = async (reset = false) => {
        if (reset) {
            requestId += 1;
            page = 0;
            seen = new Set();
            showSpotlightSkeleton();
            showSkeleton(els.grid, 12);
            els.count.textContent = '';
            els.more.hidden = true;
        }
        const currentRequest = requestId;
        const { endpoint, params } = buildRequest(type, state);
        els.more.disabled = true;
        els.more.textContent = 'Caricamento…';

        try {
            const data = await getList(endpoint, { ...params, page: page + 1 });
            if (currentRequest !== requestId) return; // nel frattempo è cambiato il filtro
            page = data.page;

            let items = data.results.filter((item) => !seen.has(item.id));
            if (reset) {
                const featured = items.find((item) => item.backdrop_path);
                els.spotlight.classList.remove('spotlight-loading');
                els.spotlight.hidden = !featured;
                if (featured) {
                    els.spotlight.replaceChildren(createSpotlight(featured, type, selectionLabel()));
                    items = items.filter((item) => item !== featured);
                    seen.add(featured.id);
                }
                const total = data.totalResults;
                els.count.textContent = `${total.toLocaleString('it-IT')} ${total === 1 ? 'titolo' : 'titoli'}`;
            }
            items.forEach((item) => seen.add(item.id));

            if (reset && data.results.length === 0) {
                els.grid.replaceChildren(createStatus('Nessun titolo per questa combinazione. Prova un altro genere.'));
            } else {
                renderCards(els.grid, items, type, { append: !reset });
            }
            els.more.hidden = page >= data.totalPages;
            els.more.textContent = 'Carica altri';
        } catch (error) {
            if (currentRequest !== requestId) return;
            if (reset) {
                els.spotlight.hidden = true;
                showError(els.grid, getErrorMessage(error), () => loadPage(true));
            } else {
                els.more.textContent = 'Errore: riprova';
            }
        } finally {
            if (currentRequest === requestId) els.more.disabled = false;
        }
    };

    const select = (changes) => {
        state = { ...state, ...changes };
        history.replaceState(null, '', location.pathname + stateToSearch(state, type));
        updateControls();

        // se ero sceso nella griglia, risalgo all'inizio dei risultati
        const top = els.header.offsetTop + els.header.offsetHeight;
        if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
        loadPage(true);
    };

    /* schede: pattern tablist con frecce, Home e Fine */
    const renderTabs = () => {
        els.tabs.replaceChildren(...lists.map((list) => {
            const tab = createButton('tab', list.label, () => {
                if (state.list !== list.id) select({ list: list.id });
            });
            tab.id = `tab-${list.id}`;
            tab.dataset.list = list.id;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', 'catalog-results');
            return tab;
        }));

        els.tabs.addEventListener('keydown', (event) => {
            const tabs = [...els.tabs.querySelectorAll('[role="tab"]')];
            const index = tabs.indexOf(document.activeElement);
            const targets = {
                ArrowRight: tabs[(index + 1) % tabs.length],
                ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length],
                Home: tabs[0],
                End: tabs[tabs.length - 1],
            };
            const target = targets[event.key];
            if (!target || index === -1) return;
            event.preventDefault();
            target.focus();
            target.click();
        });
    };

    const renderGenres = () => {
        const chip = (label, id) => {
            const button = createButton('chip chip-button', label, () => {
                if ((state.genre ?? 0) !== id) select({ genre: id || null });
            });
            button.dataset.genre = id;
            return button;
        };
        els.genres.replaceChildren(chip('Tutti i generi', 0), ...genres.map((genre) => chip(genre.name, genre.id)));
    };

    const loadGenres = async () => {
        try {
            genres = await getGenres(type);
        } catch {
            genres = []; // senza generi il catalogo funziona lo stesso
        }
        if (state.genre && !genreName()) {
            // genere sconosciuto nell'URL: torno a "tutti"
            select({ genre: null });
        }
        renderGenres();
        updateControls();
    };

    els.more.addEventListener('click', () => loadPage());
    renderTabs();
    updateControls();
    loadGenres();
    loadPage(true);
};
