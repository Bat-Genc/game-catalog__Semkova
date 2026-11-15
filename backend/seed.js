const fs = require('fs');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost', port: 3306, user: 'root',
    password: 'studentpass', database: 'games_catalog', charset: 'utf8mb4'
};

const COLUMNS = ['title', 'studio', 'year', 'rating', 'image_url', 'steam_url',
    'summary', 'genres', 'platforms', 'igdb_url', 'screenshots', 'pegi_age', 'age_synopsis'];

(async () => {
    const games = JSON.parse(fs.readFileSync('games_clean.json', 'utf8'));
    const conn = await mysql.createConnection(dbConfig);

    const [existing] = await conn.query('SELECT title FROM games');
    const have = new Set(existing.map(r => r.title.toLowerCase()));
    const fresh = games.filter(g => !have.has(g.title.toLowerCase()));

    if (fresh.length) {
        const rows = fresh.map(g => COLUMNS.map(c =>
            c === 'screenshots' ? JSON.stringify(g.screenshots || []) : (g[c] ?? null)));
        await conn.query(`INSERT INTO games (${COLUMNS.join(', ')}) VALUES ?`, [rows]);
    }
    const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM games');
    console.log(`Добавени: ${fresh.length}, пропуснати: ${games.length - fresh.length}, общо в базата: ${total}`);
    await conn.end();
})();