const fs = require('fs');

const { TWITCH_CLIENT_ID: ID, TWITCH_CLIENT_SECRET: SECRET } = process.env;
const LIMIT = 500;

async function getToken() {
    const url = `https://id.twitch.tv/oauth2/token?client_id=${ID}&client_secret=${SECRET}&grant_type=client_credentials`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Twitch токен: ' + res.status);
    return (await res.json()).access_token;
}

async function fetchGames(token) {
    const query = `
        fields name, first_release_date, total_rating, total_rating_count,
               cover.image_id, involved_companies.developer,
               involved_companies.company.name, external_games.url;
        where total_rating_count > 100 & cover != null & version_parent = null;
        sort total_rating_count desc;
        limit ${LIMIT};`;
    const res = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: { 'Client-ID': ID, 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: query
    });
    if (!res.ok) throw new Error('IGDB: ' + res.status + ' ' + await res.text());
    return res.json();
}

function clean(g) {
    const companies = g.involved_companies || [];
    const dev = companies.find(c => c.developer) || companies[0];
    const steam = (g.external_games || []).find(e => (e.url || '').includes('store.steampowered.com'));
    return {
        title: g.name,
        studio: dev?.company?.name || null,
        year: g.first_release_date ? new Date(g.first_release_date * 1000).getUTCFullYear() : null,
        rating: g.total_rating ? Math.round(g.total_rating) / 10 : null,
        image_url: `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`,
        steam_url: steam ? steam.url : null
    };
}

(async () => {
    const token = await getToken();
    const raw = await fetchGames(token);
    const games = raw.map(clean);
    fs.writeFileSync('games_raw.json', JSON.stringify(games, null, 2));

    console.log('Изтеглени:', games.length);
    console.log('Без студио:', games.filter(g => !g.studio).length);
    console.log('Без година:', games.filter(g => !g.year).length);
    console.log('Със Steam линк:', games.filter(g => g.steam_url).length);
    console.log('Пример:', games[0]);
})();