# Traccia esame — Movie App (stile Netflix)

**Corso:** Introduzione allo sviluppo frontend  
**Durata progetto:** 2 settimane  
**Documentazione API:** [The Movie Database (TMDB) — API Docs](https://developer.themoviedb.org/docs)

---

## 1. Obiettivo del progetto

Realizzare una **web app multi-pagina** in stile Netflix che mostri film e serie TV, partendo da HTML/CSS/JS già visti a lezione e integrando **chiamate HTTP GET** verso l’API pubblica di TMDB.

Al termine del progetto dovreste saper:

- strutturare pagine con HTML semantico;
- applicare CSS di base (layout, tipografia, responsive semplice);
- manipolare il DOM con JavaScript;
- usare array, arrow functions, oggetti e metodi come `map`;
- sostituire dati statici con risposte reali tramite `fetch` e programmazione asincrona (`async`/`await` o Promises).

> **Nota:** non sono richieste chiamate `POST`, `PUT` o `DELETE`. L’esame si concentra sulla **lettura** di dati dall’API.

---

## 2. Cosa avete già fatto (punto di partenza)

In classe avete già impostato la **homepage** con:

| Elemento | Descrizione |
|----------|-------------|
| **Header** | Logo + 3 link verso `/movies`, `/series`, `/profile` (ancora non funzionanti o senza contenuto dedicato) |
| **Footer** | Presente nella struttura della pagina |
| **Griglia di card** | Riquadri generati dinamicamente in JavaScript a partire da un **array statico** di film |

**Obiettivo principale dell’esame:** eliminare l’array statico e popolare la home (e le altre pagine) con dati reali da TMDB.

---

## 3. Struttura consigliata del sito

Potete organizzare il progetto come **sito multi-pagina** (consigliato per questo corso):

```
progetto/
├── index.html          # Home
├── movies.html         # Pagina film
├── series.html         # Pagina serie TV
├── profile.html        # Pagina profilo (vedi sotto)
├── css/
│   └── style.css
└── js/
    ├── main.js         # Logica home
    ├── movies.js
    ├── series.js
    ├── api.js          # Funzioni condivise per le chiamate TMDB
    └── utils.js        # Helper DOM, formattazione date, ecc.
```

I link nell’header possono puntare ai file HTML corrispondenti (`movies.html`, `series.html`, `profile.html`) oppure, se avete introdotto un router minimale, alle route equivalenti.

### 3.1 Home (`index.html`)

- Header e footer come già realizzati.
- Almeno **una sezione** (meglio due) popolata via API, ad esempio:
  - **Film trending** del giorno/settimana;
  - **Serie trending** del giorno/settimana.
- Ogni card mostra almeno: **titolo**, **poster** (immagine), **anno** o data di uscita (se disponibile nella risposta).

### 3.2 Pagina Film (`/movies`)

- Elenco di film ottenuto con una **GET** dedicata (es. film popolari o “now playing”).
- Stesso pattern di card della home, eventualmente con più elementi o layout diverso.

### 3.3 Pagina Serie (`/series`)

- Elenco di serie TV con una **GET** dedicata (es. serie popolari o “on the air”).

### 3.4 Pagina Profilo (`/profile`)

Non esiste un endpoint TMDB per un “profilo utente” del vostro sito. La pagina può essere **statica** o costruita solo con HTML/CSS, ad esempio:

- nome/nickname del gruppo o dello studente;
- breve descrizione del progetto;
- eventuale avatar placeholder;
- link alla repository GitHub.

Non è obbligatorio chiamare l’API su questa pagina.

### 3.5 Dettaglio film/serie (facoltativo ma consigliato)

Cliccando su una card si può aprire:

- una pagina `detail.html?id=123&type=movie`, oppure
- un pannello/modale sulla stessa pagina.

Il dettaglio si ottiene con una **GET** aggiuntiva (vedi sezione 5).

---

## 4. Requisiti HTML e CSS

### HTML (obbligatorio)

- `DOCTYPE`, `lang`, meta `charset` e `viewport`.
- Tag semantici: `header`, `nav`, `main`, `section`, `footer`.
- Link di navigazione funzionanti tra le pagine.
- Attributo `alt` sulle immagini dei poster.
- Markup valido e indentato in modo leggibile.

### CSS (obbligatorio)

- File CSS esterno collegato a tutte le pagine.
- Stile coerente “dark / streaming” (ispirazione Netflix, senza copiare asset protetti).
- Layout della griglia card (Flexbox o CSS Grid).
- Header leggibile (logo + menu).
- **Responsive base:** la griglia deve adattarsi su mobile (es. 1–2 colonne) e desktop (più colonne).
- Stati `:hover` su link e card (opzionale ma valutato positivamente).

Non è richiesto un framework CSS (Bootstrap, Tailwind, ecc.).

---

## 5. Integrazione API TMDB

### 5.1 Registrazione e API Key

1. Creare un account su [themoviedb.org](https://www.themoviedb.org/).
2. Accedere alle impostazioni API e richiedere una **API Key** (tipo *Developer*).
3. Leggere i termini d’uso: [API Terms of Use](https://www.themoviedb.org/api-terms-of-use).

**Base URL delle richieste:**

```text
https://api.themoviedb.org/3
```

**Autenticazione (query string):**

```text
?api_key=LA_TUA_API_KEY
```

> **Sicurezza:** non committare la API key su repository pubblici. Usate un file `config.js` o variabili locali escluso da Git (`.gitignore`), oppure chiedete al docente la modalità concordata in classe.

### 5.2 Immagini (poster)

TMDB restituisce un campo `poster_path`. L’URL completo del poster segue questo schema:

```text
https://image.tmdb.org/t/p/w500{poster_path}
```

Se `poster_path` è `null`, mostrate un placeholder (immagine locale o box grigio con testo “Nessuna immagine”).

### 5.3 Endpoint GET consigliati

| Uso | Metodo | Endpoint esempio | Note |
|-----|--------|------------------|------|
| Home — film del momento | `GET` | `/trending/movie/day` | Alternativa: `/movie/popular` |
| Home — serie del momento | `GET` | `/trending/tv/day` | Alternativa: `/tv/popular` |
| Pagina `/movies` | `GET` | `/movie/popular` o `/movie/now_playing` | Sceglietene uno e documentatelo nel README |
| Pagina `/series` | `GET` | `/tv/popular` o `/tv/on_the_air` | Idem |
| Dettaglio film (extra) | `GET` | `/movie/{movie_id}` | `movie_id` dalla card |
| Dettaglio serie (extra) | `GET` | `/tv/{tv_id}` | `tv_id` dalla card |

Parametri utili (opzionali): `language=it-IT` per titoli/descrizioni in italiano.

**Esempio URL completo (trending film):**

```text
https://api.themoviedb.org/3/trending/movie/day?api_key=XXX&language=it-IT
```

### 5.4 Cosa fare con la risposta JSON

Le risposte di lista contengono tipicamente un oggetto con proprietà `results` (array). Ogni elemento ha campi come `id`, `title` (film) o `name` (serie), `poster_path`, `overview`, `vote_average`, date di uscita.

Flusso consigliato:

1. `fetch(url)` → risposta HTTP.
2. Controllare `response.ok`.
3. `await response.json()`.
4. Iterare su `data.results` con `.map()` (o `forEach`).
5. Per ogni item, creare elementi DOM (`createElement`, `appendChild`) come già fatto con l’array statico.

### 5.5 Gestione errori e caricamento (minimo)

- Mostrare un messaggio se la fetch fallisce (rete, API key errata, limite rate).
- Opzionale: testo “Caricamento…” mentre la richiesta è in corso.
- Usare `try/catch` con `async/await` (argomento visto a lezione).

### 5.6 CORS

Le API TMDB v3 supportano richieste dal browser con API key. Se incontrate errori CORS, verificate URL, chiave e che stiate usando **solo GET**.

---

## 6. Requisiti JavaScript

### Obbligatori

| Argomento | Applicazione nel progetto |
|-----------|---------------------------|
| Variabili `const` / `let` | Configurazione URL, riferimenti DOM |
| Array e `.map()` | Trasformare `results` in card DOM |
| Arrow functions | Callback, listener, funzioni helper |
| Oggetti | Singolo film/serie, parametri di funzione |
| DOM | `querySelector`, `createElement`, `addEventListener` |
| `fetch` + async | Tutte le chiamate TMDB |
| Moduli (opzionale) | File `api.js` con funzioni riutilizzabili |

### Non richiesti per questo esame

- Framework (React, Vue, Angular);
- Build tool obbligatori (Vite/Webpack) — potete usare HTML/CSS/JS “vanilla”;
- TypeScript;
- Autenticazione OAuth TMDB;
- POST verso TMDB o backend proprio.

---

## 7. Roadmap — 2 settimane

### Settimana 1 — Struttura e API sulla home

| Giorno | Attività |
|--------|----------|
| 1–2 | Ripasso struttura esistente; creare `api.js`; ottenere API key; prima `fetch` in console o su home |
| 3–4 | Sostituire array statico: sezione “Trending film” funzionante con poster e titolo |
| 5 | Seconda sezione home “Trending serie”; gestione errori e placeholder immagini |
| 6–7 | CSS griglia e header/footer su tutte le pagine; link di navigazione funzionanti |

### Settimana 2 — Pagine dedicate e rifinitura

| Giorno | Attività |
|--------|----------|
| 8–9 | Pagina `movies.html` + GET dedicata; pagina `series.html` + GET dedicata |
| 10 | Pagina `profile.html` statica; coerenza visiva globale |
| 11–12 | *(Extra)* Dettaglio film/serie con GET by id |
| 13–14 | Test su mobile, pulizia codice, README, consegna repository |

---

## 8. Consegna

Consegnare **repository Git** (GitHub o piattaforma indicata dal docente) con:

- [ ] Tutti i file HTML/CSS/JS del progetto;
- [ ] `README.md` con:
  - nome del progetto e autori;
  - come aprire il sito in locale (es. Live Server o `npx serve`);
  - dove inserire la API key;
  - elenco endpoint TMDB usati per ogni pagina;
- [ ] `.gitignore` che esclude file con secret (es. `config.local.js`);
- [ ] **Nessuna** API key committata in chiaro.

Il docente potrà verificare:

1. Home popolata da API (non da array statico).
2. Pagine `/movies` e `/series` con GET distinte.
3. Navigazione header funzionante.
4. Codice leggibile e commentato solo dove serve.

---

## 9. Criteri di valutazione (indicativi)

| Criterio | Peso indicativo |
|----------|-----------------|
| Integrazione TMDB corretta (GET, parsing `results`, immagini) | Alto |
| Sostituzione completa dell’array statico sulla home | Alto |
| Pagine movies/series con chiamate dedicate | Alto |
| HTML semantico e CSS ordinato/responsive | Medio |
| Uso corretto di JS moderno (arrow functions, map, async/fetch) | Medio |
| Gestione errori / stati di caricamento | Medio-basso |
| Dettaglio film/serie (extra) | Bonus |
| README e igiene repository (no API key in repo) | Medio |

---

## 10. Checklist finale per lo studente

- [ ] Home: almeno una lista da API (film **o** serie); ideale: entrambe.
- [ ] Nessun array statico usato come fonte principale dei contenuti.
- [ ] `movies.html`: lista film da GET TMDB.
- [ ] `series.html`: lista serie da GET TMDB.
- [ ] Header: logo + 3 link funzionanti.
- [ ] Footer presente.
- [ ] Poster con URL TMDB o placeholder se mancante.
- [ ] Solo metodi **GET**.
- [ ] README con istruzioni e endpoint documentati.
- [ ] *(Bonus)* Pagina o vista dettaglio con `/movie/{id}` o `/tv/{id}`.

---

## 11. Risorse utili

| Risorsa | Link |
|---------|------|
| Documentazione API TMDB | [developer.themoviedb.org](https://developer.themoviedb.org/docs) |
| Login / accesso docs | [themoviedb.org — Login](https://www.themoviedb.org/login?to=read_me&redirect_uri=/docs) |
| Reference endpoint (es. trending) | [GET /trending/{media_type}/{time_window}](https://developer.themoviedb.org/reference/trending-get) |
| MDN — `fetch` | [developer.mozilla.org — Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) |
| MDN — `async/await` | [developer.mozilla.org — async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) |

---

## 12. Domande frequenti

**Posso usare React o un altro framework?**  
Per questo esame no, salvo diversa indicazione del docente. L’obiettivo è consolidare HTML, CSS e JS vanilla.

**Devo implementare login utente?**  
No. La pagina profilo è informativa/statica.

**Posso usare più sezioni sulla home (es. “Popolari”, “Top rated”)?**  
Sì, è un plus, purché ogni sezione usi una GET TMDB documentata nel README.

**Cosa succede se supero il rate limit dell’API?**  
Riducete le chiamate duplicate, evitate di richiamare la stessa lista in loop, e gestite l’errore con un messaggio all’utente.

---

*Buon lavoro — in due settimane avrete una piccola app che usa dati reali come le piattaforme di streaming professionali.*
