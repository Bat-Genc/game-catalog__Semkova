const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { validateCredentials } = require('./validate');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    console.error('Липсва JWT_SECRET в backend/.env');
    process.exit(1);
}

const PAGE = 24;
const revoked = new Set();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { error: 'Твърде много опити. Опитай по-късно.' }
});

const signToken = u => jwt.sign({ id: u.id, username: u.username }, SECRET, { expiresIn: '12h' });
const readToken = req => (req.headers.authorization || '').replace(/^Bearer /, '');

function requireAuth(req, res, next) {
    try {
        const token = readToken(req);
        if (revoked.has(token)) throw new Error('revoked');
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Необходим е вход' });
    }
}

function optionalAuth(req, res, next) {
    try { req.user = jwt.verify(readToken(req), SECRET); } catch { req.user = null; }
    next();
}

const fail = (res, err) => {
    console.error(err);
    res.status(500).json({ error: 'Грешка на сървъра' });
};

const gameId = req => {
    const id = parseInt(req.params.id, 10);
    return Number.isInteger(id) && id > 0 ? id : null;
};

async function trending(db) {
    const [rows] = await db.execute(
        `SELECT g.*, COUNT(l.game_id) AS likes_week
         FROM games g
         LEFT JOIN likes l ON l.game_id = g.id AND l.created_at > NOW() - INTERVAL 7 DAY
         GROUP BY g.id
         ORDER BY likes_week DESC, g.rating DESC, g.id
         LIMIT ${PAGE}`);
    return rows;
}

function genreWeights(rows) {
    const w = {};
    rows.forEach(r => (r.genres || '').split(', ').filter(Boolean)
        .forEach(g => { w[g] = (w[g] || 0) + 1; }));
    return w;
}

async function byLikedGenres(db, userId, liked) {
    const w = genreWeights(liked);
    const [rows] = await db.execute(
        `SELECT * FROM games WHERE genres IS NOT NULL
         AND id NOT IN (SELECT game_id FROM likes WHERE user_id = ?)`, [userId]);
    return rows
        .map(g => ({ g, score: g.genres.split(', ').reduce((s, x) => s + (w[x] || 0), 0) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score || Number(b.g.rating) - Number(a.g.rating))
        .slice(0, PAGE)
        .map(x => x.g);
}

function createAuthRouter(withDb) {
    const router = express.Router();

    router.post('/auth/register', authLimiter, async (req, res) => {
        try {
            const { errors, value } = validateCredentials(req.body);
            if (errors.length) return res.status(400).json({ error: 'Невалидни данни', details: errors });

            const hash = await bcrypt.hash(value.password, 10);
            const id = await withDb(async db => {
                const [r] = await db.execute(
                    'INSERT INTO users (username, password_hash) VALUES (?, ?)', [value.username, hash]);
                return r.insertId;
            });
            const user = { id, username: value.username };
            res.status(201).json({ token: signToken(user), user });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Потребителското име е заето' });
            fail(res, err);
        }
    });

    router.post('/auth/login', authLimiter, async (req, res) => {
        try {
            const username = String((req.body || {}).username || '').trim();
            const password = String((req.body || {}).password || '');
            const rows = await withDb(async db => {
                const [r] = await db.execute(
                    'SELECT id, username, password_hash FROM users WHERE username = ?', [username]);
                return r;
            });
            const u = rows[0];
            const ok = u && await bcrypt.compare(password, u.password_hash);
            if (!ok) return res.status(401).json({ error: 'Грешно потребителско име или парола' });

            const user = { id: u.id, username: u.username };
            res.json({ token: signToken(user), user });
        } catch (err) { fail(res, err); }
    });

    router.get('/me', requireAuth, (req, res) => {
        res.json({ id: req.user.id, username: req.user.username });
    });

    router.get('/me/likes', requireAuth, async (req, res) => {
        try {
            const rows = await withDb(async db => {
                const [r] = await db.execute(
                    `SELECT g.* FROM likes l JOIN games g ON g.id = l.game_id
                     WHERE l.user_id = ? ORDER BY l.created_at DESC`, [req.user.id]);
                return r;
            });
            res.json(rows);
        } catch (err) { fail(res, err); }
    });

    router.put('/games/:id/like', requireAuth, async (req, res) => {
        const id = gameId(req);
        if (!id) return res.status(400).json({ error: 'Невалиден номер на игра' });
        try {
            await withDb(db => db.execute(
                `INSERT INTO likes (user_id, game_id) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE user_id = user_id`, [req.user.id, id]));
            res.status(204).end();
        } catch (err) {
            if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({ error: 'Играта не е намерена' });
            fail(res, err);
        }
    });

    router.delete('/games/:id/like', requireAuth, async (req, res) => {
        const id = gameId(req);
        if (!id) return res.status(400).json({ error: 'Невалиден номер на игра' });
        try {
            await withDb(db => db.execute(
                'DELETE FROM likes WHERE user_id = ? AND game_id = ?', [req.user.id, id]));
            res.status(204).end();
        } catch (err) { fail(res, err); }
    });

    router.get('/trending', async (req, res) => {
        try { res.json(await withDb(trending)); } catch (err) { fail(res, err); }
    });

    // препоръки по жанровете на харесаните игри; без харесвания -> trending
    router.get('/recommendations', optionalAuth, async (req, res) => {
        try {
            const result = await withDb(async db => {
                if (req.user) {
                    const [liked] = await db.execute(
                        `SELECT g.genres FROM likes l JOIN games g ON g.id = l.game_id
                         WHERE l.user_id = ?`, [req.user.id]);
                    if (liked.length) {
                        const games = await byLikedGenres(db, req.user.id, liked);
                        if (games.length) return { basedOn: 'likes', games };
                    }
                }
                return { basedOn: 'trending', games: await trending(db) };
            });
            res.json(result);
        } catch (err) { fail(res, err); }
    });

    router.post('/auth/logout', requireAuth, (req, res) => {
        revoked.add(readToken(req));
        res.status(204).end();
    });

    return router;
}

module.exports = { createAuthRouter };