import { readFileSync } from 'node:fs';

/*
 * Sostituisce TMDB con le fixture registrate (scripts/record-fixtures.js):
 * test veloci, ripetibili e senza bisogno di una API key.
 */
export const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));

const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

export const TMDB_API = 'https://api.themoviedb.org/3/**';

const respondWithFixture = (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/3/', '');

    const detail = path.match(/^(movie|tv)\/(\d+)$/);
    if (detail) {
        return route.fulfill({ json: { ...fixture(`${detail[1]}-detail`), id: Number(detail[2]) } });
    }

    // pagine successive: stessi titoli con id diversi, così "Carica altri" aggiunge davvero card
    const page = Number(url.searchParams.get('page') ?? 1);
    const data = fixture(path.replaceAll('/', '-'));
    const results = data.results.map((item) => ({ ...item, id: item.id + (page - 1) * 1_000_000 }));
    return route.fulfill({ json: { ...data, page, results } });
};

export const mockApi = async (page) => {
    await page.route('**/js/config.js', (route) => route.fulfill({
        contentType: 'text/javascript',
        body: "export const TMDB_API_KEY = 'e2e-key';",
    }));
    await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
    await page.route('https://image.tmdb.org/**', (route) => route.fulfill({ contentType: 'image/png', body: PIXEL }));
    await page.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<p>trailer</p>' }));
    await page.route(TMDB_API, respondWithFixture);
};

/* fa fallire l'API con uno stato HTTP; restituisce la funzione per ripristinarla */
export const failApi = async (page, status) => {
    const handler = (route) => route.fulfill({ status, json: { status_message: 'errore simulato' } });
    await page.route(TMDB_API, handler);
    return () => page.unroute(TMDB_API, handler);
};
