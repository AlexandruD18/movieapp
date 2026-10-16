import { getDetail } from './api.js';
import { renderDetail, renderDetailSkeleton } from './detail.js';
import { createButton, createElement, createStatus, getErrorMessage } from './utils.js';

/*
 * popup dettagli: <dialog> nativo = focus trap, Esc e sfondo inerte gratis.
 * L'URL segue il titolo aperto (#movie-123) così il link si può condividere,
 * e il tasto "indietro" del browser chiude il popup invece di lasciare la pagina.
 */
const HASH_PATTERN = /^#(movie|tv)-(\d+)$/;

let dialog = null;
let content = null;
let lastFocused = null;
let requestId = 0;
let ownsHistoryEntry = false; // true se l'apertura ha aggiunto una voce alla cronologia
let pageTitle = document.title;

export const parseDetailHash = (hash) => {
    const match = hash.match(HASH_PATTERN);
    return match ? { type: match[1], id: Number(match[2]) } : null;
};

const pageUrl = () => location.pathname + location.search;

const buildDialog = () => {
    dialog = createElement('dialog', 'modal');
    dialog.setAttribute('aria-labelledby', 'modal-title');

    const closeBtn = createButton('modal_close', '×', () => dialog.close());
    closeBtn.setAttribute('aria-label', 'Chiudi');

    // il focus iniziale va sul contenuto (non sulla ×): il lettore di schermo parte dal titolo
    content = createElement('div', 'modal_inner');
    content.tabIndex = -1;
    content.autofocus = true;
    dialog.append(closeBtn, content);

    // click fuori dal riquadro (sul backdrop)
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', () => {
        requestId += 1;
        content.replaceChildren(); // ferma anche l'eventuale trailer in riproduzione
        document.documentElement.classList.remove('modal-open');
        document.title = pageTitle;

        if (ownsHistoryEntry) {
            ownsHistoryEntry = false;
            history.back();
        } else if (parseDetailHash(location.hash)) {
            history.replaceState(null, '', pageUrl());
        }
        lastFocused?.focus({ preventScroll: true });
    });

    // indietro/avanti del browser
    window.addEventListener('popstate', () => {
        const target = parseDetailHash(location.hash);
        if (target) {
            loadDetail(target.type, target.id);
        } else if (dialog.open) {
            ownsHistoryEntry = false; // la voce è già stata tolta dal browser
            dialog.close();
        }
    });

    document.body.append(dialog);
};

const showDialog = () => {
    if (dialog.open) return;
    lastFocused = document.activeElement;
    pageTitle = document.title;
    dialog.showModal();
    document.documentElement.classList.add('modal-open');
};

const loadDetail = async (type, id) => {
    const currentRequest = ++requestId;
    showDialog();
    content.replaceChildren(renderDetailSkeleton());
    content.scrollTop = 0;

    try {
        const detail = await getDetail(type, id);
        if (currentRequest !== requestId) return; // chiuso o riaperto su un altro titolo nel frattempo
        content.replaceChildren(renderDetail(type, detail));
        document.title = `${detail.title || detail.name} · movieApp`;
    } catch (error) {
        if (currentRequest !== requestId) return;
        const box = createStatus(getErrorMessage(error), 'status-error');
        box.setAttribute('role', 'alert');
        box.append(createButton('btn btn-secondary', 'Riprova', () => loadDetail(type, id)));
        content.replaceChildren(box);
    }
};

/**
 * @param {'movie'|'tv'} type
 * @param {number} id
 */
export const openDetail = (type, id) => {
    if (!dialog) buildDialog();
    const hash = `#${type}-${id}`;

    if (location.hash !== hash) {
        // dal popup a un titolo consigliato: sostituisce la voce invece di accumularne
        if (dialog.open) {
            history.replaceState(null, '', hash);
        } else {
            history.pushState(null, '', hash);
            ownsHistoryEntry = true;
        }
    }
    loadDetail(type, id);
};

/* apre il dettaglio se la pagina è stata aperta con #movie-123 o #tv-456 */
export const openDetailFromHash = () => {
    const target = parseDetailHash(location.hash);
    if (!target) return;
    if (!dialog) buildDialog();
    loadDetail(target.type, target.id);
};
