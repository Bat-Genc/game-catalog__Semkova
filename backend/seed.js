const fs = require('fs');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost', port: 3306, user: 'root',
    password: 'studentpass', database: 'games_catalog', charset: 'utf8mb4'
};

(async () => {
    const games = JSON.parse(fs.readFileSync('games_clean.json', 'utf8'));
    const conn = await mysql.createConnection(dbConfig);

    const [existing] = await conn.query('SELECT title FROM games');
    const have = new Set(existing.map(r => r.title.toLowerCase()));
    const fresh = games.filter(g => !have.has(g.title.toLowerCase()));

    if (fresh.length) {
        const rows = fresh.map(g => [g.title, g.studio, g.year, g.rating, g.image_url, g.steam_url]);
        await conn.query(
            'INSERT INTO games (title, studio, year, rating, image_url, steam_url) VALUES ?',
            [rows]
        );
    }
    const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM games');
    console.log(`Добавени: ${fresh.length}, пропуснати: ${games.length - fresh.length}, общо в базата: ${total}`);
    await conn.end();
})();