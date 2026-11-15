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

// GET /api/games?search=&studio=&minRating=&sort=year|rating
app.get('/api/games', async (req, res) => {
    try 
    {
        const { sql, countSql, params } = buildGamesQuery(req.query);

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(sql, params);
        const [[{ total }]] = await connection.execute(countSql, params);
        await connection.end();

        res.set('X-Total-Count', total);
        res.json(rows);
    } 
    catch (err) 
    {
        console.error(err);
        res.status(500).json({ error: 'Грешка при заявка към базата данни' });
    }
});

// POST /api/games (CRUD демо)
app.post('/api/games', async (req, res) => {
    try {
        const {
            title, studio, year, guide, rating, image_url,
            official_tags, content_explanation, steam_url, epic_url
        } = req.body;

        if (!title || !studio) {
            return res.status(400).json({ error: 'title и studio са задължителни' });
        }

        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            `INSERT INTO games
             (title, studio, year, guide, rating, image_url, official_tags, content_explanation, steam_url, epic_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title, studio, year ?? null, guide ?? null, rating ?? null, image_url ?? null,
                official_tags ?? null, content_explanation ?? null, steam_url ?? null, epic_url ?? null
            ]
        );
        await connection.end();

        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Грешка при добавяне на игра' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend слуша на http://localhost:${PORT}`);
});