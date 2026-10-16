import { getImageUrl } from './api.js';
import { isFavorite, toggleFavorite } from './favorites.js';
import {
    createButton,
    createCard,
    createElement,
    extractYear,
    formatRuntime,
    getReleaseDate,
    getTitle,
} from './utils.js';

/* contenuto del popup dettagli: funzioni di formattazione (testate) + costruzione del DOM */

const TYPE_LABELS = { movie: 'Film', tv: 'Serie TV' };

const STATUS_LABELS = {
    Released: 'Uscito',
    'Post Production': 'In post-produzione',
    'In Production': 'In produzione',
    Planned: 'Annunciato',
    Rumored: 'Non confermato',
    Canceled: 'Cancellato',
    'Returning Series': 'In corso',
    Ended: 'Conclusa',
    Pilot: 'Episodio pilota',
};

const PROVIDER_GROUPS = [
    ['flatrate', 'In abbonamento'],
    ['free', 'Gratis'],
    ['ads', 'Gratis con pubblicità'],
    ['rent', 'Noleggio'],
    ['buy', 'Acquisto'],
];

/* formattazione */
export const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
};

export const getLanguageName = (code) => {
    if (!code) return null;
    try {
        const name = new Intl.DisplayNames(['it'], { type: 'language' }).of(code);
        return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
        return code.toUpperCase();
    }
};

export const getStatusLabel = (status) => STATUS_LABELS[status] ?? status ?? null;

export const formatMoney = (amount) => (amount > 0
    ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(amount)
    : null);

export const getScoreLevel = (vote) => {
    if (vote >= 7) return 'high';
    if (vote >= 5) return 'mid';
    return 'low';
};

/* trailer YouTube: preferisce quello ufficiale, altrimenti un trailer qualsiasi o un teaser */
export const findTrailer = (videos = []) => {
    const youtube = videos.filter((video) => video.site === 'YouTube');
    return youtube.find((video) => video.type === 'Trailer' && video.official)
        ?? youtube.find((video) => video.type === 'Trailer')
        ?? youtube.find((video) => video.type === 'Teaser')
        ?? null;
};

/* piattaforme per l'Italia raggruppate per tipo di offerta */
export const groupProviders = (countryData) => {
    if (!countryData) return [];
    return PROVIDER_GROUPS
        .map(([key, label]) => ({
            label,
            providers: [...(countryData[key] ?? [])].sort((a, b) => a.display_priority - b.display_priority),
        }))
        .filter((group) => group.providers.length > 0);
};

/* dati per la colonna laterale, già pronti come coppie [etichetta, valore] */
export const getFacts = (type, detail) => {
    const names = (people = []) => people.map((person) => person.name).join(', ');
    const facts = [];

    if (type === 'movie') {
        const directors = detail.credits?.crew?.filter((person) => person.job === 'Director');
        facts.push(
            ['Regia', names(directors)],
            ['Uscita', formatDate(detail.release_date)],
            ['Durata', formatRuntime(detail.runtime)],
            ['Stato', getStatusLabel(detail.status)],
            ['Lingua originale', getLanguageName(detail.original_language)],
            ['Budget', formatMoney(detail.budget)],
            ['Incassi', formatMoney(detail.revenue)],
        );
    } else {
        const next = detail.next_episode_to_air;
        facts.push(
            ['Ideata da', names(detail.created_by)],
            ['Rete', names(detail.networks)],
            ['Prima messa in onda', formatDate(detail.first_air_date)],
            ['Stato', getStatusLabel(detail.status)],
            ['Episodi', detail.number_of_episodes ? String(detail.number_of_episodes) : null],
            ['Prossimo episodio', next ? `S${next.season_number} E${next.episode_number} · ${formatDate(next.air_date)}` : null],
            ['Lingua originale', getLanguageName(detail.original_language)],
        );
    }

    const originalTitle = detail.original_title || detail.original_name;
    if (originalTitle && originalTitle !== getTitle(detail)) facts.push(['Titolo originale', originalTitle]);

    return facts.filter(([, value]) => value);
};

/* DOM */
const createImage = (src, alt, width, height, className) => {
    const img = new Image(width, height);
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    if (className) img.className = className;
    return img;
};

const createSection = (title, className = '') => {
    const section = createElement('section', `detail_section ${className}`.trim());
    section.append(createElement('h3', 'detail_section-title', title));
    return section;
};

/* lista a scorrimento orizzontale: focusabile così si scorre anche con le frecce */
const createScrollList = (label) => {
    const list = createElement('ul', 'people');
    list.tabIndex = 0;
    list.setAttribute('aria-label', label);
    return list;
};

const createScore = (detail) => {
    const box = createElement('div', 'detail_score');
    if (!detail.vote_average) {
        box.append(createElement('p', 'detail_score-empty', 'Ancora nessun voto'));
        return box;
    }

    const vote = detail.vote_average;
    const votes = (detail.vote_count ?? 0).toLocaleString('it-IT');
    const ring = createElement('div', 'score', vote.toFixed(1));
    ring.dataset.level = getScoreLevel(vote);
    ring.style.setProperty('--score', Math.round(vote * 10));
    ring.setAttribute('role', 'img');
    ring.setAttribute('aria-label', `Voto ${vote.toFixed(1)} su 10`);

    const label = createElement('p', 'detail_score-label', 'Voto degli utenti');
    label.append(createElement('span', 'detail_score-count', `${votes} voti su TMDB`));
    box.append(ring, label);
    return box;
};

const createFacts = (type, detail) => {
    const list = createElement('dl', 'detail_facts');
    getFacts(type, detail).forEach(([label, value]) => {
        const row = createElement('div', 'detail_fact');
        row.append(createElement('dt', '', label), createElement('dd', '', value));
        list.append(row);
    });
    return list;
};

const createHeadingMeta = (type, detail) => {
    const meta = createElement('div', 'detail_meta');
    const items = [TYPE_LABELS[type], extractYear(getReleaseDate(detail))];

    if (type === 'movie') {
        items.push(formatRuntime(detail.runtime));
    } else if (detail.number_of_seasons) {
        const seasons = detail.number_of_seasons;
        items.push(`${seasons} ${seasons === 1 ? 'stagione' : 'stagioni'}`);
    }

    items.filter((item) => item && item !== 'N/D').forEach((item, index) => {
        meta.append(createElement('span', index === 0 ? 'badge badge-accent' : 'badge', item));
    });
    return meta;
};

const createActions = (type, detail, trailerBox) => {
    const actions = createElement('div', 'detail_actions');

    const trailer = findTrailer(detail.videos?.results);
    if (trailer) {
        const label = { closed: '▶ Guarda il trailer', open: '■ Chiudi il trailer' };
        const trailerBtn = createButton('btn btn-primary', label.closed, () => {
            const opening = trailerBox.hidden;
            trailerBox.hidden = !opening;
            trailerBtn.textContent = opening ? label.open : label.closed;
            trailerBtn.setAttribute('aria-expanded', String(opening));

            if (!opening) {
                trailerBox.replaceChildren(); // ferma il video
                return;
            }
            const iframe = createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`;
            iframe.title = `Trailer di ${getTitle(detail)}`;
            iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
            iframe.allowFullscreen = true;
            trailerBox.replaceChildren(iframe);
            trailerBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        trailerBtn.setAttribute('aria-expanded', 'false');
        actions.append(trailerBtn);
    }

    const favoriteBtn = createButton('btn btn-secondary btn-favorite');
    const updateFavorite = (active) => {
        favoriteBtn.textContent = active ? '♥ Nella tua lista' : '♡ La mia lista';
        favoriteBtn.setAttribute('aria-pressed', String(active));
    };
    favoriteBtn.addEventListener('click', () => updateFavorite(toggleFavorite(type, detail)));
    updateFavorite(isFavorite(type, detail.id));
    actions.append(favoriteBtn);

    const shareBtn = createButton('btn btn-ghost', '↗ Condividi', async () => {
        const url = location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: getTitle(detail), url });
                return;
            }
            await navigator.clipboard.writeText(url);
            shareBtn.textContent = '✓ Link copiato';
        } catch (error) {
            if (error.name === 'AbortError') return; // condivisione annullata dall'utente
            shareBtn.textContent = 'Copia non riuscita';
        }
        setTimeout(() => { shareBtn.textContent = '↗ Condividi'; }, 2000);
    });
    actions.append(shareBtn);

    return actions;
};

const createHero = (type, detail, trailerBox) => {
    const hero = createElement('header', 'detail_hero');
    const backdropUrl = getImageUrl(detail.backdrop_path, 'w1280');
    if (backdropUrl) hero.style.setProperty('--backdrop', `url(${backdropUrl})`);

    const poster = createElement('div', 'detail_poster');
    const posterUrl = getImageUrl(detail.poster_path, 'w342');
    poster.append(posterUrl
        ? createImage(posterUrl, `Poster di ${getTitle(detail)}`, 342, 513)
        : createElement('div', 'card_placeholder', getTitle(detail)));

    const heading = createElement('div', 'detail_heading');
    const title = createElement('h2', 'detail_title', getTitle(detail));
    title.id = 'modal-title';
    heading.append(createHeadingMeta(type, detail), title);
    if (detail.tagline) heading.append(createElement('p', 'detail_tagline', detail.tagline));

    if (detail.genres?.length) {
        const genres = createElement('ul', 'detail_genres');
        genres.setAttribute('aria-label', 'Generi');
        genres.append(...detail.genres.map((genre) => createElement('li', 'chip', genre.name)));
        heading.append(genres);
    }
    heading.append(createActions(type, detail, trailerBox));

    const inner = createElement('div', 'detail_hero-inner');
    inner.append(poster, heading);
    hero.append(inner);
    return hero;
};

const createProviders = (detail) => {
    const section = createSection('Dove guardarlo');
    const countryData = detail['watch/providers']?.results?.IT;
    const groups = groupProviders(countryData);

    if (groups.length === 0) {
        section.append(createElement('p', 'detail_muted', 'Al momento non risulta disponibile in streaming in Italia.'));
        return section;
    }

    groups.forEach((group) => {
        const row = createElement('div', 'providers');
        row.append(createElement('span', 'providers_label', group.label));
        const list = createElement('ul', 'providers_list');
        list.append(...group.providers.map((provider) => {
            const item = createElement('li', 'providers_item');
            item.title = provider.provider_name;
            item.append(createImage(getImageUrl(provider.logo_path, 'w92'), provider.provider_name, 92, 92, 'providers_logo'));
            return item;
        }));
        row.append(list);
        section.append(row);
    });

    // attribuzione richiesta da TMDB per questi dati
    const credit = createElement('p', 'detail_credit', 'Dati sulle piattaforme forniti da JustWatch. ');
    const link = createElement('a', '', 'Vedi tutte le offerte');
    link.href = countryData.link;
    link.target = '_blank';
    link.rel = 'noopener';
    credit.append(link);
    section.append(credit);
    return section;
};

const createCast = (cast = []) => {
    const people = cast.slice(0, 12);
    if (people.length === 0) return null;

    const section = createSection('Cast principale');
    const list = createScrollList('Cast principale');
    list.append(...people.map((person) => {
        const item = createElement('li', 'person');
        const photoUrl = getImageUrl(person.profile_path, 'w185');
        item.append(photoUrl
            ? createImage(photoUrl, '', 185, 278, 'person_photo')
            : createElement('div', 'person_photo person_photo-empty', person.name.charAt(0)));
        item.append(createElement('span', 'person_name', person.name));
        if (person.character) item.append(createElement('span', 'person_role', person.character));
        return item;
    }));
    section.append(list);
    return section;
};

const createSeasons = (seasons = []) => {
    const list = seasons.filter((season) => season.season_number > 0);
    if (list.length === 0) return null;

    const section = createSection(`Stagioni (${list.length})`);
    const row = createScrollList('Stagioni');
    row.append(...list.map((season) => {
        const item = createElement('li', 'person season');
        const posterUrl = getImageUrl(season.poster_path, 'w185');
        item.append(posterUrl
            ? createImage(posterUrl, '', 185, 278, 'person_photo')
            : createElement('div', 'person_photo person_photo-empty', String(season.season_number)));
        const episodes = `${season.episode_count} ${season.episode_count === 1 ? 'episodio' : 'episodi'}`;
        item.append(
            createElement('span', 'person_name', season.name),
            createElement('span', 'person_role', `${extractYear(season.air_date)} · ${episodes}`),
        );
        return item;
    }));
    section.append(row);
    return section;
};

const createSimilar = (type, detail) => {
    const items = detail.recommendations?.results?.filter((item) => item.poster_path).slice(0, 12) ?? [];
    if (items.length === 0) return null;

    const section = createSection('Potrebbe piacerti anche', 'detail_similar');
    const track = createElement('div', 'scroll-row_track');
    track.append(...items.map((item) => createCard(item, item.media_type || type)));
    section.append(track);
    return section;
};

export const renderDetail = (type, detail) => {
    const root = createElement('article', 'detail');

    const trailerBox = createElement('div', 'detail_trailer');
    trailerBox.hidden = true;

    const main = createElement('div', 'detail_main');
    const plot = createSection('Trama');
    plot.append(createElement('p', 'detail_overview', detail.overview || 'Trama non ancora disponibile in italiano.'));
    main.append(plot, createProviders(detail));

    const cast = createCast(detail.credits?.cast);
    if (cast) main.append(cast);
    if (type === 'tv') {
        const seasons = createSeasons(detail.seasons);
        if (seasons) main.append(seasons);
    }

    const aside = createElement('aside', 'detail_aside');
    aside.setAttribute('aria-label', 'Informazioni');
    aside.append(createScore(detail), createFacts(type, detail));

    const layout = createElement('div', 'detail_layout');
    layout.append(main, aside);

    root.append(createHero(type, detail, trailerBox), trailerBox, layout);

    const similar = createSimilar(type, detail);
    if (similar) root.append(similar);
    return root;
};

/* scheletro mostrato mentre arriva la risposta */
export const renderDetailSkeleton = () => {
    const root = createElement('div', 'detail detail-loading');
    root.setAttribute('role', 'status');
    root.setAttribute('aria-label', 'Caricamento dettagli');

    const hero = createElement('div', 'detail_hero');
    const inner = createElement('div', 'detail_hero-inner');
    const heading = createElement('div', 'detail_heading');
    heading.append(
        createElement('div', 'skeleton skeleton-line skeleton-short'),
        createElement('div', 'skeleton skeleton-title'),
        createElement('div', 'skeleton skeleton-line'),
    );
    inner.append(createElement('div', 'detail_poster skeleton'), heading);
    hero.append(inner);

    const layout = createElement('div', 'detail_layout');
    const main = createElement('div', 'detail_main');
    main.append(...Array.from({ length: 4 }, () => createElement('div', 'skeleton skeleton-line')));
    layout.append(main);

    root.append(hero, layout);
    return root;
};
