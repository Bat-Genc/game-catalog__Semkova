const fs = require('fs');
const answer = JSON.parse(fs.readFileSync('gemini_answer.json', 'utf8'));
const file = 'explanations.json';
const result = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};

const CONTENT_RE = /violence|language|expletive|gambling|drugs|scary|sexual/i;
let added = 0;
const skipped = [];

for (const g of answer) {
    const ok = g.text && g.text !== 'НЕ_ЗНАМ' && CONTENT_RE.test(g.official || '');
    if (ok) {
        result[g.id] = { title: g.title, pegi: g.pegi, text: g.text.trim() };
        added++;
    } else {
        skipped.push(g.title);
    }
}
fs.writeFileSync(file, JSON.stringify(result, null, 2));
console.log(`Добавени: ${added}, общо: ${Object.keys(result).length}`);
console.log('Пропуснати:', skipped.join(', '));