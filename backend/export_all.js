const fs = require('fs');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost', port: 3306, user: 'root',
    password: 'studentpass', database: 'games_catalog', charset: 'utf8mb4'
};

const CHUNK = 40;
const CONTENT_RE = /violence|language|expletive|gambling|drugs|scary|sexual/i;

(async () => {
    const conn = await mysql.createConnection(dbConfig);
    const [games] = await conn.query(
        `SELECT id, title, pegi_age, age_synopsis FROM games
         WHERE content_explanation IS NULL AND age_synopsis IS NOT NULL
         ORDER BY FIELD(pegi_age, 16, 12, 18, 7, 3), rating DESC`);
    await conn.end();

    const done = fs.existsSync('explanations.json')
        ? JSON.parse(fs.readFileSync('explanations.json', 'utf8')) : {};
    const todo = games
        .filter(g => !done[g.id] && CONTENT_RE.test(g.age_synopsis))
        .map(g => ({ id: g.id, title: g.title, pegi: g.pegi_age, official: g.age_synopsis, text: '' }));

    // чистим старите порции
    fs.readdirSync('.').filter(f => /^to_explain_\d+\.json$/.test(f)).forEach(f => fs.unlinkSync(f));

    for (let i = 0; i < todo.length; i += CHUNK) {
        const name = `to_explain_${i / CHUNK + 1}.json`;
        fs.writeFileSync(name, JSON.stringify(todo.slice(i, i + CHUNK), null, 2));
    }
    console.log(`Игри за обясняване: ${todo.length}, порции: ${Math.ceil(todo.length / CHUNK)}`);
})();