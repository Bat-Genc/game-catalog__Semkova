const path = require('path');
const DATA = path.join(__dirname, '..', 'data');




const fs = require('fs');

const { TWITCH_CLIENT_ID: ID, TWITCH_CLIENT_SECRET: SECRET } = process.env;
const LIMIT = 500;
const PC_PLATFORM_ID = 6; // PC (Microsoft Windows)
const PEGI_ORG = 2;
const PEGI_BY_CATEGORY = { 8: 3, 9: 7, 10: 12, 11: 16, 12: 18 };

async function getToken() {
    const url = `https://id.twitch.tv/oauth2/token?client_id=${ID}&client_secret=${SECRET}&grant_type=client_credentials`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Twitch токен: ' + res.status);
    return (await res.json()).access_token;
}

async function fetchGames(token) {
    const query = `
        fields name, summary, url, first_release_date, total_rating, total_rating_count,
               cover.image_id, genres.name, platforms.name, screenshots.image_id,
               involved_companies.developer, involved_companies.company.name,
               external_games.url, age_ratings.organization,
               age_ratings.rating_category, age_ratings.synopsis;
        where total_rating_count > 50 & cover != null & version_parent = null
              & platforms = (${PC_PLATFORM_ID});
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
    const pegi = (g.age_ratings || []).find(a => a.organization === PEGI_ORG);
    return {
        title: g.name,
        studio: dev?.company?.name || null,
        year: g.first_release_date ? new Date(g.first_release_date * 1000).getUTCFullYear() : null,
        rating: g.total_rating ? Math.round(g.total_rating) / 10 : null,
        image_url: `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`,
        steam_url: steam ? steam.url : null,
        summary: g.summary || null,
        genres: (g.genres || []).map(x => x.name).join(', ') || null,
        platforms: (g.platforms || []).map(x => x.name).join(', ') || null,
        igdb_url: g.url || null,
        screenshots: (g.screenshots || []).slice(0, 4)
            .map(s => `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${s.image_id}.jpg`),
        pegi_age: pegi ? (PEGI_BY_CATEGORY[pegi.rating_category] ?? null) : null,
        age_synopsis: pegi?.synopsis || null
    };
}

(async () => {
    const token = await getToken();
    const raw = await fetchGames(token);
    const games = raw.map(clean).filter(g => g.studio && g.year);
    fs.writeFileSync(path.join(DATA, 'games_raw.json'), JSON.stringify(games, null, 2));

    console.log('Изтеглени:', raw.length, '| след филтър студио/година:', games.length);
    console.log('Със Steam линк:', games.filter(g => g.steam_url).length);
    console.log('С PEGI възраст:', games.filter(g => g.pegi_age).length);
    console.log('С PEGI описание:', games.filter(g => g.age_synopsis).length);
    console.log('Пример:', games[0]);
})();