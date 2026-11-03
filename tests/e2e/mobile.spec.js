import { expect, test } from '@playwright/test';
import { mockApi } from './mock-api.js';

test.beforeEach(async ({ page }) => {
    await mockApi(page);
});

test('il menu si apre dal pulsante e porta alle pagine', async ({ page }) => {
    await page.goto('/index.html');
    const toggle = page.getByRole('button', { name: 'Apri menu' });
    const filmLink = page.getByRole('link', { name: 'Film', exact: true });

    await expect(filmLink).toBeHidden();
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Chiudi menu' })).toHaveAttribute('aria-expanded', 'true');
    await filmLink.click();
    await expect(page).toHaveURL(/movies\.html$/);
});

test('nessuno scroll orizzontale e griglia a due colonne', async ({ page }) => {
    await page.goto('/movies.html');
    await expect(page.locator('#catalog-grid .card').first()).toBeVisible();

    const { overflow, columns } = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        columns: getComputedStyle(document.querySelector('#catalog-grid')).gridTemplateColumns.split(' ').length,
    }));
    expect(overflow).toBe(false);
    expect(columns).toBe(2);
});

test('il popup occupa tutto lo schermo', async ({ page }) => {
    await page.goto('/index.html#movie-27205');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { level: 2 })).toBeVisible();

    // Il popup si apre con un'animazione: la misura vale quando è finita.
    const viewport = page.viewportSize();
    await expect(async () => {
        const box = await dialog.boundingBox();
        expect(Math.round(box.width)).toBe(viewport.width);
        expect(Math.round(box.height)).toBe(viewport.height);
    }).toPass({ timeout: 5000 });
});
