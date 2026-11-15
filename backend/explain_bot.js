const fs = require('fs');
const mysql = require('mysql2/promise');

const KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-3.8-flash';
const PEGI_ORDER = [7, 12, 16, 3, 18]; // в този ред
const PER_GROUP = 8;  
const OUT = 'explanations.json';
const dbConfig = {
    host: 'localhost', port: 3306, user: 'root',
    password: 'studentpass', database: 'games_catalog', charset: 'utf8mb4'
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

function buildPrompt(g) {
    return `Игра: ${g.title}. PEGI ${g.pegi_age}+.
Официално PEGI описание (английски): ${g.age_synopsis}
Описание на играта (английски): ${(g.summary || '').slice(0, 600)}

Напиши 1-2 изречения на български за родители и нови играчи: какво реално
съдържание има (насилие, език, теми). Използвай САМО фактите по-горе.
Не измисляй. Без реклама. Ако фактите не стигат, отговори точно: НЕ_ЗНАМ`;
}

async function ask(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!res.ok) throw new Error(res.status + ' ' + await res.text());
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function generate() {
    const conn = await mysql.createConnection(dbConfig);
    const games = [];
    for (const age of PEGI_ORDER) {
        const [rows] = await conn.query(
            `SELECT id, title, pegi_age, age_synopsis, summary FROM games
             WHERE content_explanation IS NULL AND age_synopsis IS NOT NULL AND pegi_age = ?
             ORDER BY rating DESC LIMIT ?`, [age, PER_GROUP]);
        games.push(...rows);
    }
    await conn.end();

    const result = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
    for (const g of games) {
        if (result[g.id]) continue; // вече генерирано, пропускаме
        try {
            const text = await ask(buildPrompt(g));
            if (text && text !== 'НЕ_ЗНАМ') result[g.id] = { title: g.title, pegi: g.pegi_age, text };
            console.log(`[PEGI ${g.pegi_age}]`, g.title, '->', text.slice(0, 70));
        } catch (e) {
            console.error(g.title, 'грешка:', e.message);
        }
        fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
        await sleep(6000);
    }
    console.log(`Готово. Прегледай ${OUT}, после: node explain_bot.js --apply`);
}

async function apply() {
    const data = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const conn = await mysql.createConnection(dbConfig);
    for (const [id, { text }] of Object.entries(data)) {
        await conn.query('UPDATE games SET content_explanation = ? WHERE id = ?', [text, Number(id)]);
    }
    await conn.end();
    console.log('Записани:', Object.keys(data).length);
}

process.argv.includes('--apply') ? apply() : generate();