const fs = require('fs');

const { TWITCH_CLIENT_ID: ID, TWITCH_CLIENT_SECRET: SECRET } = process.env;

async function getToken() {
    const url = `https://id.twitch.tv/oauth2/token?client_id=${ID}&client_secret=${SECRET}&grant_type=client_credentials`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Twitch токен: ' + res.status);
    return (await res.json()).access_token;
}

async function igdb(token, query) {
    const res = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: { 'Client-ID': ID, 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: query
    });
    if (!res.ok) throw new Error('IGDB: ' + res.status + ' ' + await res.text());
    return res.json();
}

(async () => {
    const token = await getToken();

    // 1) Три конкретни игри: виждаме суровия отговор
    const sample = await igdb(token, `
        fields name, summary, url, genres.name, platforms.name,
               screenshots.image_id, age_ratings.*;
        where name = ("Super Mario World", "The Witcher 3: Wild Hunt", "Hades")
              & version_parent = null;
        limit 5;`);
    fs.writeFileSync('preview.json', JSON.stringify(sample, null, 2));
    console.log('Пример (пълният отговор е в preview.json):');
    sample.forEach(g => console.log(
        `- ${g.name}: summary=${!!g.summary}, жанрове=${(g.genres || []).map(x => x.name).join('/')}, ` +
        `платформи=${(g.platforms || []).length}, кадри=${(g.screenshots || []).length}, ` +
        `age_ratings=${(g.age_ratings || []).length}, url=${g.url}`
    ));

    // 2) Статистика върху същите 500 игри, които вече теглим
    const top = await igdb(token, `
        fields name, summary, url, genres.name, platforms.name,
               screenshots.image_id, age_ratings.id;
        where total_rating_count > 100 & cover != null & version_parent = null;
        sort total_rating_count desc;
        limit 500;`);
    const has = f => top.filter(g => g[f] && (!Array.isArray(g[f]) || g[f].length)).length;
    console.log(`\nОт ${top.length} игри имат:`);
    ['summary', 'genres', 'platforms', 'screenshots', 'age_ratings', 'url']
        .forEach(f => console.log(`  ${f}: ${has(f)}`));
    const pc = top.filter(g => (g.platforms || []).some(p => /PC \(Microsoft Windows\)/.test(p.name)));
    console.log(`  излизали на PC: ${pc.length}`);
})();