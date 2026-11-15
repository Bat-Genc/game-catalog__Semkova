const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('games_raw.json', 'utf8'));

function cleanSteamUrl(url) {
    const m = (url || '').match(/store\.steampowered\.com\/app\/(\d+)/);
    return m ? `https://store.steampowered.com/app/${m[1]}/` : null;
}

const seen = new Set();
const games = [];
for (const g of raw) {
    const key = g.title.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    games.push({
        ...g,
        title: g.title.trim(),
        studio: g.studio.replace(/\s+/g, ' ').trim(),
        steam_url: cleanSteamUrl(g.steam_url)
    });
}

fs.writeFileSync('games_clean.json', JSON.stringify(games, null, 2));

const studios = new Set(games.map(g => g.studio));
console.log('Дубликати махнати:', raw.length - games.length);
console.log('Остават:', games.length);
console.log('Със Steam линк:', games.filter(g => g.steam_url).length);
console.log('С PEGI възраст:', games.filter(g => g.pegi_age).length);
console.log('Различни студиа:', studios.size);