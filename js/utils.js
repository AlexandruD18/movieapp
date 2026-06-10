const extractYear = (dateString) => {
  return dateString ? dateString.substring(0, 4) : 'N/D';
};

const getStarRating = (voteAverage) => {
  const activeStars = Math.round(voteAverage / 2);
  return '★'.repeat(activeStars) + '☆'.repeat(5 - activeStars);
};

const createCard = (item, type = 'movie') => {
  const { id, title, name, poster_path, release_date, first_air_date, vote_average, overview } = item;
  
  const cardEl = document.createElement('article');
  cardEl.className = 'card';
  cardEl.setAttribute('data-id', id);
  cardEl.setAttribute('data-type', type);
  cardEl.style.cursor = 'pointer';

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'card_img-container';

  const posterUrl = getImageUrl(poster_path, 'w500');

  if (posterUrl) {
    const posterImg = new Image();
    posterImg.src = posterUrl;
    posterImg.alt = title || name || 'Poster';
    posterImg.className = 'card_img';
    posterImg.loading = 'lazy';
    imageWrapper.appendChild(posterImg);
  } else {
    const noImageFallback = document.createElement('div');
    noImageFallback.className = 'card_placeholder';
    noImageFallback.textContent = 'Nessuna immagine';
    imageWrapper.appendChild(noImageFallback);
  }

  const infoOverlay = document.createElement('div');
  infoOverlay.className = 'card_overlay';

  const titleEl = document.createElement('h3');
  titleEl.className = 'card_title';
  titleEl.textContent = title || name || 'Titolo sconosciuto';

  const metaEl = document.createElement('div');
  metaEl.className = 'card_meta';

  const year = extractYear(release_date || first_air_date);
  const yearEl = document.createElement('span');
  yearEl.className = 'card_year';
  yearEl.textContent = year;

  const ratingEl = document.createElement('span');
  ratingEl.className = 'card_rating';
  ratingEl.textContent = getStarRating(vote_average || 0);

  const voteEl = document.createElement('span');
  voteEl.className = 'card_vote';
  voteEl.textContent = vote_average ? vote_average.toFixed(1) : 'N/D';

  metaEl.appendChild(yearEl);
  metaEl.appendChild(ratingEl);
  metaEl.appendChild(voteEl);

  const overviewEl = document.createElement('p');
  overviewEl.className = 'card_overview';
  overviewEl.textContent = overview
    ? overview.substring(0, 120) + (overview.length > 120 ? '…' : '')
    : '';

  infoOverlay.appendChild(titleEl);
  infoOverlay.appendChild(metaEl);
  infoOverlay.appendChild(overviewEl);

  cardEl.appendChild(imageWrapper);
  cardEl.appendChild(infoOverlay);

  cardEl.addEventListener('mouseenter', () => cardEl.classList.add('card-hover'));
  cardEl.addEventListener('mouseleave', () => cardEl.classList.remove('card-hover'));

  return cardEl;
};

const renderCards = (container, items, type = 'movie') => {
  if (!container) return;
  container.innerHTML = '';
  if (!items || items.length === 0) {
    container.innerHTML = '<p class="error-msg">Nessun risultato trovato.</p>';
    return;
  }
  items.forEach(item => {
    const card = createCard(item, type);
    container.appendChild(card);
  });
};

const showLoading = (container) => {
  if (!container) return;
  container.innerHTML = '<p class="loading-msg">Caricamento…</p>';
};

const showError = (container, message = 'Errore nel caricamento.') => {
  if (!container) return;
  container.innerHTML = `<p class="error-msg">${message}</p>`;
};
