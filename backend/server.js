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

app.get('/api/games', async (req, res) => {
    try {
        const { search, studio, minRating } = req.query;
        let sql = 'SELECT * FROM games WHERE 1=1';
        const params = [];

        if (search) { sql += ' AND title LIKE ?'; params.push(`%${search}%`); }
        if (studio) { sql += ' AND studio = ?'; params.push(studio); }
        if (minRating) { sql += ' AND rating >= ?'; params.push(parseFloat(minRating)); }

        sql += ' ORDER BY rating DESC';

        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(sql, params);
        await connection.end();

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Грешка при заявка към базата данни' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend слуша на http://localhost:${PORT}`);
});