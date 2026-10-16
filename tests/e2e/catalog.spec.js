import { expect, test } from '@playwright/test';
import { failApi, fixture, mockApi } from './mock-api.js';

test.beforeEach(async ({ page }) => {
    await mockApi(page);
});

const featuredOf = (name) => fixture(name).results.find((item) => item.backdrop_path);
const genreId = (type, name) => fixture(`genre-${type}-list`).genres.find((genre) => genre.name === name).id;
const apiRequest = (page, path) => page.waitForRequest((request) => request.url().startsWith(`https://api.themoviedb.org/3${path}?`));

const grid = (page) => page.locator('#catalog-grid .card');
const selectedTab = (page) => page.getByRole('tab', { selected: true });

test('film: titolo in evidenza, griglia con il resto della lista e conteggio', async ({ page }) => {
    const list = fixture('movie-popular');
    const featured = featuredOf('movie-popular');
    await page.goto('/movies.html');

    const spotlight = page.locator('#spotlight');
    await expect(spotlight.getByRole('heading', { level: 2 })).toHaveText(featured.title);
    await expect(grid(page)).toHaveCount(list.results.length - 1); // il primo è in evidenza
    await expect(page.locator('#catalog-count')).toHaveText(`${list.total_results.toLocaleString('it-IT')} titoli`);

    await spotlight.getByRole('button', { name: /Scopri di più/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#movie-${featured.id}$`));
});

test('"Carica altri" aggiunge la pagina successiva', async ({ page }) => {
    const perPage = fixture('movie-popular').results.length;
    await page.goto('/movies.html');

    await expect(grid(page)).toHaveCount(perPage - 1);
    await page.getByRole('button', { name: 'Carica altri' }).click();
    await expect(grid(page)).toHaveCount(perPage * 2 - 1);
});

test('le schede cambiano elenco, URL e intestazione', async ({ page }) => {
    await page.goto('/movies.html');
    await expect(selectedTab(page)).toHaveText('Popolari');

    const request = apiRequest(page, '/movie/top_rated');
    await page.getByRole('tab', { name: 'Più votati' }).click();
    await request;

    await expect(selectedTab(page)).toHaveText('Più votati');
    await expect(page).toHaveURL(/movies\.html\?list=top_rated$/);
    await expect(page.locator('#catalog-heading')).toHaveText('Più votati');
    await expect(page.locator('#spotlight-title')).toHaveText(featuredOf('movie-top_rated').title);
});

test('il genere usa /discover con i criteri della scheda attiva', async ({ page }) => {
    const animation = genreId('movie', 'Animazione');
    await page.goto('/movies.html?list=top_rated');
    await expect(grid(page).first()).toBeVisible();

    const request = apiRequest(page, '/discover/movie');
    await page.getByRole('button', { name: 'Animazione', exact: true }).click();
    const params = new URL((await request).url()).searchParams;

    expect(params.get('with_genres')).toBe(String(animation));
    expect(params.get('sort_by')).toBe('vote_average.desc');
    await expect(page).toHaveURL(new RegExp(`\\?list=top_rated&genre=${animation}$`));
    await expect(page.locator('#catalog-heading')).toHaveText('Più votati · Animazione');
    await expect(page.getByRole('button', { name: 'Animazione', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('le serie ripristinano scheda e genere dall’URL', async ({ page }) => {
    const animation = genreId('tv', 'Animazione');
    const request = apiRequest(page, '/discover/tv');
    await page.goto(`/series.html?list=airing_today&genre=${animation}`);

    const params = new URL((await request).url()).searchParams;
    expect(params.get('air_date.gte')).toBe(params.get('air_date.lte')); // "Oggi in TV" = solo oggi
    await expect(selectedTab(page)).toHaveText('Oggi in TV');
    await expect(page.getByRole('button', { name: 'Animazione', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(grid(page)).toHaveCount(fixture('discover-tv').results.length - 1);
});

test('un genere sconosciuto nell’URL torna a "Tutti i generi"', async ({ page }) => {
    await page.goto('/movies.html?genre=999999');
    await expect(page.getByRole('button', { name: 'Tutti i generi' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/movies\.html$/);
});

test('da tastiera: frecce, Home e Fine tra le schede', async ({ page }) => {
    await page.goto('/series.html');
    await selectedTab(page).focus();

    await page.keyboard.press('ArrowRight');
    await expect(selectedTab(page)).toHaveText('In onda');
    await expect(selectedTab(page)).toBeFocused();

    await page.keyboard.press('End');
    await expect(selectedTab(page)).toHaveText('Oggi in TV');
    await page.keyboard.press('ArrowRight'); // ricomincia dalla prima
    await expect(selectedTab(page)).toHaveText('Popolari');
});

test('una combinazione senza titoli lo spiega', async ({ page }) => {
    await page.route('https://api.themoviedb.org/3/discover/**', (route) => route.fulfill({
        json: { page: 1, total_pages: 0, total_results: 0, results: [] },
    }));
    await page.goto(`/movies.html?genre=${genreId('movie', 'Animazione')}`);

    await expect(page.locator('#catalog-grid')).toContainText('Nessun titolo per questa combinazione');
    await expect(page.locator('#catalog-count')).toHaveText('0 titoli');
    await expect(page.locator('#spotlight')).toBeHidden();
});

test('se l’API fallisce mostra il motivo e "Riprova" funziona', async ({ page }) => {
    const restore = await failApi(page, 401);
    await page.goto('/movies.html');

    const results = page.locator('#catalog-grid');
    await expect(results.getByRole('alert')).toHaveText(/API key TMDB non valida/);

    await restore();
    await results.getByRole('button', { name: 'Riprova' }).click();
    await expect(grid(page)).toHaveCount(fixture('movie-popular').results.length - 1);
    await expect(page.locator('#spotlight')).toBeVisible();
});

test('cambiare filtro mentre una risposta è in arrivo non mescola i risultati', async ({ page }) => {
    // la lista "Popolari" arriva in ritardo: deve vincere la scheda scelta dopo
    await page.route('https://api.themoviedb.org/3/movie/popular?*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        await route.fallback();
    });
    await page.goto('/movies.html');
    await page.getByRole('tab', { name: 'In arrivo' }).click();

    await expect(page.locator('#spotlight-title')).toHaveText(featuredOf('movie-upcoming').title);
    await page.waitForTimeout(1000); // lascia arrivare la risposta lenta
    await expect(page.locator('#spotlight-title')).toHaveText(featuredOf('movie-upcoming').title);
    await expect(page.locator('#catalog-heading')).toHaveText('In arrivo');
});
