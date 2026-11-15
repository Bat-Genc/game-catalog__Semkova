const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

app.use(cors());
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
    try {
        const { search, studio, minRating, sort } = req.query;
        let sql = 'SELECT * FROM games WHERE 1=1';
        const params = [];

        if (search) { sql += ' AND title LIKE ?'; params.push(`%${search}%`); }
        if (studio) { sql += ' AND studio = ?'; params.push(studio); }
        if (minRating) { sql += ' AND rating >= ?'; params.push(parseFloat(minRating)); }

        // Сортиране (ORDER BY е след всички WHERE условия)
        if (sort === 'year') {
            sql += ' ORDER BY year DESC';
        } else {
            sql += ' ORDER BY rating DESC';
        }

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(sql, params);
        await connection.end();

        res.json(rows);
    } catch (err) {
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