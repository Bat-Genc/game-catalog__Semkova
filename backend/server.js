const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { buildGamesQuery } = require('./query');

const app = express();
const PORT = 3000;

app.use(cors({ exposedHeaders: ['X-Total-Count'] }));
app.use(express.json());

const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'studentpass',
    database: 'games_catalog',
    charset: 'utf8mb4'
};

// Отваря връзка, изпълнява fn и ВИНАГИ я затваря (дори при грешка)
async function withDb(fn) {
    const connection = await mysql.createConnection(dbConfig);
    try {
        return await fn(connection);
    } finally {
        await connection.end();
    }
}

function sendError(res, err, message) {
    console.error(err);
    res.status(500).json({ error: message });
}

// GET /api/games?search=&studio=&minRating=&sort=year|rating&limit=&page=
app.get('/api/games', async (req, res) => {
    try {
        const { sql, countSql, params } = buildGamesQuery(req.query);

        const { rows, total } = await withDb(async db => {
            const [rows] = await db.execute(sql, params);
            const [[{ total }]] = await db.execute(countSql, params);
            return { rows, total };
        });

        res.set('X-Total-Count', total);
        res.json(rows);
    } catch (err) {
        sendError(res, err, 'Грешка при заявка към базата данни');
    }
});

// POST /api/games
app.post('/api/games', async (req, res) => {
    try {
        const {
            title, studio, year, guide, rating, image_url,
            official_tags, content_explanation, steam_url, epic_url
        } = req.body;

        if (!title || !studio) {
            return res.status(400).json({ error: 'title и studio са задължителни' });
        }

        const result = await withDb(async db => {
            const [r] = await db.execute(
                `INSERT INTO games
                 (title, studio, year, guide, rating, image_url, official_tags, content_explanation, steam_url, epic_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    title, studio, year ?? null, guide ?? null, rating ?? null, image_url ?? null,
                    official_tags ?? null, content_explanation ?? null, steam_url ?? null, epic_url ?? null
                ]
            );
            return r;
        });

        res.status(201).json({ id: result.insertId });
    } catch (err) {
        sendError(res, err, 'Грешка при добавяне на игра');
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend слуша на http://localhost:${PORT}`);
});