const fs = require('fs');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost', port: 3306, user: 'root',
    password: 'studentpass', database: 'games_catalog', charset: 'utf8mb4'
};

const PEGI_ORDER = [7, 12, 16, 3, 18];
const PER_GROUP = 10; // колко игри от всяка възрастова група

(async () => {
    const conn = await mysql.createConnection(dbConfig);
    const out = [];
    for (const age of PEGI_ORDER) {
        const [rows] = await conn.query(
            `SELECT id, title, pegi_age, age_synopsis FROM games
             WHERE content_explanation IS NULL AND age_synopsis IS NOT NULL AND pegi_age = ?
             ORDER BY rating DESC LIMIT ?`, [age, PER_GROUP]);
        out.push(...rows);
    }
    await conn.end();

    // пропускаме вече генерираните
    const done = fs.existsSync('explanations.json')
        ? JSON.parse(fs.readFileSync('explanations.json', 'utf8')) : {};
    const todo = out.filter(g => !done[g.id]).map(g => ({
        id: g.id, title: g.title, pegi: g.pegi_age, official: g.age_synopsis, text: ''
    }));

    fs.writeFileSync('to_explain.json', JSON.stringify(todo, null, 2));
    console.log(`Записани ${todo.length} игри в to_explain.json`);
})();