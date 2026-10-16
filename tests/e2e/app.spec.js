import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { failApi, fixture, mockApi } from './mock-api.js';

test.beforeEach(async ({ page }) => {
    await mockApi(page);
});

const dialogOf = (page) => page.getByRole('dialog');

test.describe('pagine', () => {
    test('la home mostra hero e sezioni caricate dalla API', async ({ page }) => {
        const trending = fixture('trending-movie-day').results;
        await page.goto('/index.html');

        await expect(page.locator('#hero-title')).toHaveText(trending.find((movie) => movie.backdrop_path).title);
        await expect(page.locator('#trending-movies-track .card')).toHaveCount(trending.length);
        await expect(page.locator('#trending-series-track .card')).toHaveCount(fixture('trending-tv-day').results.length);
        await expect(page.locator('#top-rated-grid .card')).toHaveCount(fixture('movie-top_rated').results.length);
    });

    test('la pagina film carica altre card su richiesta', async ({ page }) => {
        const perPage = fixture('movie-popular').results.length;
        await page.goto('/movies.html');

        const grid = page.locator('#popular-movies-grid .card');
        await expect(grid).toHaveCount(perPage);
        await page.locator('#popular-movies-more').click();
        await expect(grid).toHaveCount(perPage * 2);
    });

    test('la pagina serie usa i suoi endpoint', async ({ page }) => {
        await page.goto('/series.html');
        await expect(page.locator('#popular-series-grid .card')).toHaveCount(fixture('tv-popular').results.length);
        await expect(page.locator('#on-the-air-grid .card')).toHaveCount(fixture('tv-on_the_air').results.length);
    });

    test('se l’API fallisce mostra il motivo e "Riprova" funziona', async ({ page }) => {
        const restore = await failApi(page, 401);
        await page.goto('/movies.html');

        const grid = page.locator('#popular-movies-grid');
        await expect(grid.getByRole('alert')).toHaveText(/API key TMDB non valida/);

        await restore();
        await grid.getByRole('button', { name: 'Riprova' }).click();
        await expect(grid.locator('.card')).toHaveCount(fixture('movie-popular').results.length);
    });
});

test.describe('popup dettagli', () => {
    test('si apre da una card con i dati del titolo e si chiude con Esc', async ({ page }) => {
        await page.goto('/index.html');
        await page.locator('#top-rated-grid .card').first().click();

        const dialog = dialogOf(page);
        await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Inception');
        await expect(dialog).toContainText('Christopher Nolan');
        await expect(dialog.getByRole('heading', { name: 'Dove guardarlo' })).toBeVisible();
        await expect(dialog.getByRole('img', { name: /^Voto/ })).toBeVisible();
        await expect(page).toHaveURL(/#movie-\d+$/);
        await expect(page).toHaveTitle('Inception · movieApp');

        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(page).toHaveURL(/\/index\.html$/);
        await expect(page).toHaveTitle(/^movieApp/);
    });

    test('il tasto indietro del browser chiude il popup', async ({ page }) => {
        await page.goto('/index.html');
        await page.locator('#top-rated-grid .card').first().click();
        await expect(dialogOf(page)).toBeVisible();

        await page.goBack();
        await expect(dialogOf(page)).toBeHidden();
        await expect(page).toHaveURL(/\/index\.html$/);
    });

    test('da tastiera: Invio apre, Esc chiude e il focus torna sulla card', async ({ page }) => {
        await page.goto('/index.html');
        const card = page.locator('#top-rated-grid .card').first();
        await card.focus();
        await page.keyboard.press('Enter');
        await expect(dialogOf(page).getByRole('heading', { level: 2 })).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(card).toBeFocused();
    });

    test('un link con #tv-id apre direttamente la serie, con le stagioni', async ({ page }) => {
        await page.goto('/movies.html#tv-1396');

        const dialog = dialogOf(page);
        await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Breaking Bad');
        await expect(dialog.getByRole('heading', { name: /Stagioni \(\d+\)/ })).toBeVisible();
    });

    test('il trailer si apre e si chiude', async ({ page }) => {
        await page.goto('/index.html#movie-27205');
        const dialog = dialogOf(page);

        await dialog.getByRole('button', { name: /Guarda il trailer/ }).click();
        await expect(dialog.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\//);

        await dialog.getByRole('button', { name: /Chiudi il trailer/ }).click();
        await expect(dialog.locator('iframe')).toHaveCount(0);
    });

    test('un titolo consigliato si apre nello stesso popup', async ({ page }) => {
        await page.goto('/index.html#movie-27205');
        const similar = dialogOf(page).locator('.detail_similar .card').first();
        const { id, type } = await similar.evaluate((card) => ({ ...card.dataset }));

        await similar.click();
        await expect(page).toHaveURL(new RegExp(`#${type}-${id}$`));
        await expect(dialogOf(page)).toBeVisible();
    });
});

test('ricerca: suggerimenti, frecce e Invio aprono il dettaglio', async ({ page }) => {
    const expected = fixture('search-multi').results.filter((item) => ['movie', 'tv'].includes(item.media_type)).length;
    await page.goto('/index.html');

    await page.getByRole('searchbox', { name: 'Cerca film o serie TV' }).fill('incep');
    const results = page.locator('.search_result');
    await expect(results).toHaveCount(Math.min(expected, 8));

    await page.keyboard.press('ArrowDown');
    await expect(results.first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialogOf(page).getByRole('heading', { level: 2 })).toBeVisible();
});

test('la mia lista: aggiungo dal popup, ritrovo nel profilo, rimuovo', async ({ page }) => {
    await page.goto('/index.html#movie-27205');
    const favoriteButton = dialogOf(page).locator('.btn-favorite');
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');
    await expect(favoriteButton).toHaveText(/Nella tua lista/);

    await page.goto('/profile.html');
    await expect(page.locator('#favorites-grid .card')).toHaveCount(1);
    await expect(page.locator('#stat-movies')).toHaveText('1');
    await expect(page.locator('#stat-series')).toHaveText('0');

    await page.getByRole('button', { name: 'Serie TV', exact: true }).click();
    await expect(page.locator('#favorites-grid')).toContainText('Nessun titolo in questa categoria');
    await page.getByRole('button', { name: 'Tutti' }).click();

    await page.locator('#favorites-grid .card').click();
    await dialogOf(page).getByRole('button', { name: /Nella tua lista/ }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'La tua lista è vuota' })).toBeVisible();
});

test.describe('accessibilità (axe, WCAG 2 AA)', () => {
    const scan = (page) => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    for (const path of ['/index.html', '/movies.html', '/profile.html']) {
        test(`nessuna violazione su ${path}`, async ({ page }) => {
            await page.goto(path);
            await page.waitForLoadState('networkidle');
            const { violations } = await scan(page);
            expect(violations.map((violation) => `${violation.id}: ${violation.nodes[0].target}`)).toEqual([]);
        });
    }

    test('nessuna violazione con il popup aperto', async ({ page }) => {
        await page.goto('/index.html#movie-27205');
        await expect(dialogOf(page).getByRole('heading', { level: 2 })).toBeVisible();
        const { violations } = await scan(page);
        expect(violations.map((violation) => `${violation.id}: ${violation.nodes[0].target}`)).toEqual([]);
    });
});
