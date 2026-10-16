# movieApp 🎬

[![CI](https://github.com/AlexandruD18/movieapp-dimofte/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexandruD18/movieapp-dimofte/actions/workflows/ci.yml)

Web app in stile Netflix per esplorare film e serie TV con dati in tempo reale da [TMDB](https://www.themoviedb.org/).
È scritta in **HTML, CSS e JavaScript vanilla** (ES modules), senza framework né build step, ed è coperta da test unitari, end-to-end e di accessibilità.

**[▶ Demo live](https://alexandrud18.github.io/movieapp-dimofte/)** · [Read in English](README.md)

![Home di movieApp](assets/screenshot-home.jpg)

| Dettaglio del titolo | Dove guardarlo, cast, scheda |
|---|---|
| ![Popup di dettaglio](assets/screenshot-detail.jpg) | ![Popup di dettaglio, più in basso](assets/screenshot-detail-2.jpg) |

---

## Funzionalità

- **Home**: hero a rotazione con i film del giorno, carousel di film e serie trending, griglia dei più votati
- **Film / Serie TV**: liste popolari, in sala e in onda, con paginazione "Carica altri"
- **Ricerca live** nella navbar: suggerimenti con debounce, navigabile da tastiera (↑ ↓ Invio Esc)
- **Popup di dettaglio**:
  - anello del voto, generi, regia o autori, uscita, budget e incassi
  - **dove guardarlo in Italia** (abbonamento, noleggio, acquisto), con dati JustWatch
  - cast con foto, stagioni per le serie, trailer YouTube incorporato e titoli consigliati
  - pulsante per condividere
- **Link condivisibili**: `index.html#movie-27205` apre direttamente un titolo, e il **tasto indietro chiude il popup**
- **La mia lista**: preferiti nel `localStorage`, sincronizzati tra le schede aperte, con filtri e statistiche calcolate (voto medio, ore di visione)
- **Responsive e accessibile**: menu mobile, popup a schermo intero sui telefoni, navigazione da tastiera, focus visibile, WCAG 2 AA verificato con axe
- **Stati di caricamento ed errore**: skeleton, messaggi chiari (chiave non valida, rete assente, rate limit) e pulsante "Riprova"

## Scelte tecniche

| Tema | Cosa ho fatto |
|---|---|
| Architettura | ES modules, ognuno con un solo compito: `api.js` (rete), `detail.js` (contenuto del popup), `modal.js` (ciclo di vita e cronologia), `favorites.js`, `layout.js` (header e ricerca comuni), più uno script per pagina |
| Rete | Cache delle richieste in memoria: hero e carousel condividono la stessa chiamata `/trending`. Gli errori non restano in cache, quindi "Riprova" rifà davvero la richiesta. Il dettaglio carica cast, video, piattaforme e consigliati in **una sola** richiesta con `append_to_response` |
| Race condition | Ricerca e popup scartano le risposte arrivate dopo una richiesta più recente |
| Cronologia | Il popup aggiunge una voce alla cronologia: "indietro" lo chiude, e un titolo consigliato sostituisce la voce invece di accumularne |
| DOM | Event delegation (un solo listener per tutte le card, anche quelle caricate dopo). I dati esterni passano solo da `textContent`, mai da `innerHTML` |
| Piattaforma nativa | `<dialog>` per focus trap ed Esc, container query per le card strette, `srcset` per i poster, `fetchpriority` per l'immagine LCP, `Intl` per date, lingue e valute |
| Segreti | La API key sta in `js/config.js`, escluso da git. In produzione viene iniettata da una secret di GitHub al momento del deploy |

## Qualità

- **42 test unitari** (Vitest + jsdom): formattazione, client API (cache, errori, chiave mancante), preferiti, rendering del dettaglio
- **19 test end-to-end** (Playwright, desktop e mobile): tutte le pagine, il popup (tastiera, tasto indietro, deep link, trailer, consigliati), ricerca, la mia lista, errore e "Riprova", più **scansioni di accessibilità axe** delle pagine e del popup aperto
- I test E2E usano **risposte TMDB registrate** ([`scripts/record-fixtures.js`](scripts/record-fixtures.js)): veloci, ripetibili, e in CI non serve la API key
- **ESLint** e **html-validate** a ogni push. Il deploy su GitHub Pages parte solo se la CI passa
- **Lighthouse**, home: Performance 98 desktop / ~87 mobile, Accessibilità 100, Best Practices 100, SEO 100

## Avvio in locale

1. Richiedi una API key gratuita (v3) su [themoviedb.org](https://www.themoviedb.org/settings/api)
2. Copia `js/config.example.js` in `js/config.js` e inserisci la chiave
3. Installa gli strumenti di sviluppo e avvia il server (i moduli ES non funzionano con `file://`):

```bash
npm install
npm run dev          # http://127.0.0.1:4173
```

| Comando | Cosa fa |
|---|---|
| `npm run lint` | ESLint + validazione HTML |
| `npm test` | Test unitari |
| `npm run test:e2e` | Test end-to-end e di accessibilità |
| `npm run check` | Tutto quanto sopra |
| `node scripts/record-fixtures.js` | Riregistra le risposte TMDB usate dai test E2E |

## Deploy

[`deploy.yml`](.github/workflows/deploy.yml) pubblica il sito su GitHub Pages dopo che la CI è passata su `master`:

1. **Settings → Secrets and variables → Actions**: aggiungi la secret `TMDB_API_KEY`
2. **Settings → Pages → Source**: seleziona **GitHub Actions**

In un sito solo frontend la chiave resta comunque visibile nelle richieste del browser. Per una chiave TMDB di sola lettura è accettabile; per nasconderla servirebbe un piccolo proxy lato server.

## Origine del progetto

È nato come progetto d'esame del corso *Introduzione allo sviluppo frontend* ([traccia](docs/TRACCIA-ESAME.md)). Poi l'ho esteso con ricerca, dettaglio, lista personale, accessibilità, test automatici e CI/CD.

## Autore

**Alexandru Dimofte** · [GitHub](https://github.com/AlexandruD18)

---

<sub>Questo prodotto usa l'API di TMDB ma non è approvato né certificato da TMDB. Dati sulle piattaforme di streaming forniti da JustWatch.</sub>
