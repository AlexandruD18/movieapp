/*
 * La chiave vive in config.js, escluso da git. L'URL è calcolato a runtime
 * così i bundler e i test non provano a risolvere un file che può mancare.
 * @returns {Promise<string|null>}
 */
export const loadApiKey = () => import(/* @vite-ignore */ new URL('./config.js', import.meta.url).href)
    .then((module) => module.TMDB_API_KEY)
    .catch(() => null);
