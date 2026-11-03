const API_URL = 'http://localhost:3000/api/games';
const container = document.getElementById('games-container');
const searchInput = document.getElementById('search');
const studioSelect = document.getElementById('studio');
const minRatingInput = document.getElementById('minRating');
const resetBtn = document.getElementById('reset');

let allStudiosLoaded = false;

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

async function loadGames() {
    const params = new URLSearchParams();
    if (searchInput.value) params.set('search', searchInput.value);
    if (studioSelect.value) params.set('studio', studioSelect.value);
    if (minRatingInput.value) params.set('minRating', minRatingInput.value);

    try {
        const res = await fetch(`${API_URL}?${params}`);
        const games = await res.json();
        renderGames(games);
        if (!allStudiosLoaded) {
            populateStudios(games);
            allStudiosLoaded = true;
        }
    } catch (err) {
        container.innerHTML = '<p>❌ Грешка при зареждане на игрите.</p>';
        console.error(err);
    }
}

function renderGames(games) {
    if (games.length === 0) {
        container.innerHTML = '<p>Няма намерени игри.</p>';
        return;
    }
    container.innerHTML = games.map(g => `
        <article class="game-card">
            <img src="${g.image_url}" alt="${g.title}" loading="lazy">
            <div class="game-info">
                <h2>${g.title}</h2>
                <p><strong>Студио:</strong> ${g.studio} (${g.year})</p>
                <p><strong>Рейтинг:</strong> ⭐ ${g.rating}</p>
                <details><summary>Упътване</summary><p>${g.guide || 'Няма'}</p></details>
            </div>
        </article>
    `).join('');
}

function populateStudios(games) {
    const studios = [...new Set(games.map(g => g.studio))];
    studios.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        studioSelect.appendChild(opt);
    });
}

searchInput.addEventListener('input', debounce(loadGames, 300));
studioSelect.addEventListener('change', loadGames);
minRatingInput.addEventListener('input', debounce(loadGames, 400));
resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    studioSelect.value = '';
    minRatingInput.value = '';
    loadGames();
});

loadGames();