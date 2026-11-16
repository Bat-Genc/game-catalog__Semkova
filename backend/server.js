const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { buildGamesQuery } = require('./query');
const { validateGame } = require('./validate');

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

// GET /api/games/:id
app.get('/api/games/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Невалиден номер на игра' });
        }

        const rows = await withDb(async db => {
            const [r] = await db.execute('SELECT * FROM games WHERE id = ?', [id]);
            return r;
        });

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Играта не е намерена' });
        }
        res.json(rows[0]);
    } catch (err) {
        sendError(res, err, 'Грешка при заявка към базата данни');
    }
});

// POST /api/games
app.post('/api/games', async (req, res) => {
    try {
        const { errors, value: g } = validateGame(req.body);
        if (errors.length) {
            return res.status(400).json({ error: 'Невалидни данни', details: errors });
        }

        const result = await withDb(async db => {
            const [r] = await db.execute(
                `INSERT INTO games
                 (title, studio, year, guide, rating, image_url, official_tags, content_explanation, steam_url, epic_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [g.title, g.studio, g.year, g.guide, g.rating, g.image_url,
                 g.official_tags, g.content_explanation, g.steam_url, g.epic_url]
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