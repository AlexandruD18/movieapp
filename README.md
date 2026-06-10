# movieApp 🎬

Web app multi-pagina in stile Netflix che mostra film e serie TV in tempo reale, tramite le API pubbliche di TMDB (The Movie Database).

Progetto esame — Corso Introduzione allo Sviluppo Frontend.

---

## Funzionalità

- **Home** — hero dinamico con il film trending del giorno, carousel di film e serie trending, griglia dei più votati
- **Film** — film popolari e film attualmente in sala
- **Serie TV** — serie popolari e serie in onda
- **Profilo** — pagina statica con dati utente e statistiche di visione
- **Ricerca** — barra di ricerca nella navbar

---

## Struttura del progetto

```
movieapp/
├── index.html          # Home
├── movies.html         # Pagina film
├── series.html         # Pagina serie TV
├── profile.html        # Pagina profilo
├── css/
│   └── style.css       # Tutti gli stili
└── js/
    ├── api.js          # Chiamate all'API TMDB
    ├── utils.js        # Funzioni helper (createCard, renderCards, ecc.)
    ├── main.js         # Logica homepage
    ├── movies.js       # Logica pagina film
    └── series.js       # Logica pagina serie TV
```

---

## Come avviare il progetto

Il progetto usa `fetch()` per chiamare le API, quindi richiede un server locale (aprire direttamente `index.html` nel browser causa errori CORS).

**Con VS Code — Live Server (consigliato):**

1. Installa l'estensione **Live Server**
2. Clicca su `Go Live` in basso a destra
3. Si apre automaticamente nel browser

---

## Tecnologie usate

- HTML5 semantico
- CSS3 (custom properties, flexbox, grid, animazioni)
- JavaScript vanilla (ES6+, async/await, fetch API)
- [TMDB API](https://developer.themoviedb.org/docs) — dati film e serie TV

---

## Autore

**Alexandru Dimofte** — Progetto esame Frontend 2026
