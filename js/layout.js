import { getImageUrl, searchMulti } from './api.js';
import { openDetail, openDetailFromHash } from './modal.js';
import {
    createButton,
    createElement,
    debounce,
    extractYear,
    getErrorMessage,
    getReleaseDate,
    getTitle,
} from './utils.js';

/* parti comuni a tutte le pagine: header, menu mobile, ricerca, apertura card */

const initNav = () => {
    const toggle = document.getElementById('nav-toggle');
    const list = document.getElementById('nav-list');
    if (!toggle || !list) return;

    const setOpen = (open) => {
        list.classList.toggle('nav_list-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    };

    toggle.addEventListener('click', () => setOpen(!list.classList.contains('nav_list-open')));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setOpen(false);
    });
    document.addEventListener('click', (event) => {
        if (!list.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });
};

const initHeaderScroll = () => {
    const header = document.getElementById('header');
    if (!header) return;
    const update = () => header.classList.toggle('header-scrolled', window.scrollY > 20);
    window.addEventListener('scroll', update, { passive: true });
    update();
};

/* barra di ricerca con suggerimenti live */
const initSearch = () => {
    const search = document.getElementById('search');
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    const results = document.getElementById('search-results');
    if (!search || !input || !results) return;

    let lastQuery = '';

    const close = () => {
        results.hidden = true;
    };

    const show = (nodes) => {
        results.replaceChildren(...nodes);
        results.hidden = false;
    };

    const message = (text) => createElement('p', 'search_message', text);

    const createResult = (item) => {
        const button = createButton('search_result', undefined, () => {
            close();
            openDetail(item.media_type, item.id);
        });

        const posterUrl = getImageUrl(item.poster_path, 'w92');
        if (posterUrl) {
            const thumb = new Image(92, 138);
            thumb.src = posterUrl;
            thumb.alt = '';
            thumb.className = 'search_thumb';
            button.append(thumb);
        } else {
            button.append(createElement('span', 'search_thumb search_thumb-empty', '?'));
        }

        const info = createElement('span', 'search_info');
        const type = item.media_type === 'movie' ? 'Film' : 'Serie TV';
        info.append(
            createElement('span', 'search_title', getTitle(item)),
            createElement('span', 'search_meta', `${type} · ${extractYear(getReleaseDate(item))}`),
        );
        button.append(info);
        return button;
    };

    const runSearch = debounce(async (query) => {
        try {
            const items = await searchMulti(query);
            if (query !== lastQuery) return; // risposta di una ricerca ormai superata
            show(items.length
                ? items.slice(0, 8).map(createResult)
                : [message(`Nessun risultato per “${query}”.`)]);
        } catch (error) {
            if (query === lastQuery) show([message(getErrorMessage(error))]);
        }
    }, 350);

    input.addEventListener('input', () => {
        const query = input.value.trim();
        clearBtn.hidden = input.value === '';
        lastQuery = query;

        if (query.length < 2) {
            close();
            return;
        }
        show([message('Ricerca in corso…')]);
        runSearch(query);
    });

    input.addEventListener('focus', () => {
        if (lastQuery.length >= 2 && results.childElementCount > 0) show([...results.children]);
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        lastQuery = '';
        clearBtn.hidden = true;
        close();
        input.focus();
    });

    /* tastiera: ↓/↑ tra i risultati, Esc per chiudere */
    search.addEventListener('keydown', (event) => {
        const items = [...results.querySelectorAll('.search_result')];
        const index = items.indexOf(document.activeElement);

        if (event.key === 'ArrowDown' && !results.hidden) {
            event.preventDefault();
            items[Math.min(index + 1, items.length - 1)]?.focus();
        } else if (event.key === 'ArrowUp' && index !== -1) {
            event.preventDefault();
            (index > 0 ? items[index - 1] : input).focus();
        } else if (event.key === 'Escape') {
            close();
            input.focus();
        }
    });

    document.addEventListener('click', (event) => {
        if (!search.contains(event.target)) close();
    });
};

/* un solo listener per tutte le card della pagina, anche quelle caricate dopo */
const initCardActions = () => {
    const open = (card) => openDetail(card.dataset.type, Number(card.dataset.id));

    document.addEventListener('click', (event) => {
        const card = event.target.closest('.card[data-id]');
        if (card) open(card);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (event.target.matches?.('.card[data-id]')) {
            event.preventDefault();
            open(event.target);
        }
    });
};

export const initLayout = () => {
    initNav();
    initHeaderScroll();
    initSearch();
    initCardActions();
    openDetailFromHash();
};
