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
  imageWrapper.className = 'card__img-container';

  const posterUrl = getImageUrl(poster_path, 'w500');

  if (posterUrl) {
    const posterImg = new Image();
    posterImg.src = posterUrl;
    posterImg.alt = title || name || 'Poster';
    posterImg.className = 'card__img';
    posterImg.loading = 'lazy';
    imageWrapper.appendChild(posterImg);
  } else {
    const noImageFallback = document.createElement('div');
    noImageFallback.className = 'card__placeholder';
    noImageFallback.textContent = 'Nessuna immagine';
    imageWrapper.appendChild(noImageFallback);
  }

  const infoOverlay = document.createElement('div');
  infoOverlay.className = 'card__overlay';

  const titleEl = document.createElement('h3');
  titleEl.className = 'card__title';
  titleEl.textContent = title || name || 'Titolo sconosciuto';

  const