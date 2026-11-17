const MIN_YEAR = 1950;
const URL_RE = /^https?:\/\//i;

function cleanText(v) {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
}

function checkText(value, name, max, errors) {
    if (value && value.length > max) errors.push(`${name} е твърде дълго (макс. ${max})`);
}

function checkUrl(value, name, errors) {
    if (value && (!URL_RE.test(value) || value.length > 500)) {
        errors.push(`${name} трябва да е http(s) адрес до 500 символа`);
    }
}

function checkNumber(raw, name, { min, max, integer }, errors) {
    const text = cleanText(raw);
    if (text === null) return null;
    const n = Number(text);
    if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
        errors.push(`${name} трябва да е ${integer ? 'цяло число' : 'число'} между ${min} и ${max}`);
        return null;
    }
    return integer ? n : Math.round(n * 10) / 10;
}

function validateGame(body = {}) {
    const errors = [];
    const g = {
        title: cleanText(body.title),
        studio: cleanText(body.studio),
        guide: cleanText(body.guide),
        image_url: cleanText(body.image_url),
        official_tags: cleanText(body.official_tags),
        content_explanation: cleanText(body.content_explanation),
        steam_url: cleanText(body.steam_url),
        epic_url: cleanText(body.epic_url)
    };

    if (!g.title) errors.push('title е задължително');
    if (!g.studio) errors.push('studio е задължително');
    checkText(g.title, 'title', 255, errors);
    checkText(g.studio, 'studio', 255, errors);
    checkText(g.official_tags, 'official_tags', 255, errors);
    ['image_url', 'steam_url', 'epic_url'].forEach(f => checkUrl(g[f], f, errors));

    const maxYear = new Date().getFullYear() + 2;
    g.year = checkNumber(body.year, 'year', { min: MIN_YEAR, max: maxYear, integer: true }, errors);
    g.rating = checkNumber(body.rating, 'rating', { min: 0, max: 10, integer: false }, errors);

    return { errors, value: g };
}

module.exports = { validateGame };

function validateCredentials(body = {}) {
    const errors = [];
    const username = cleanText(body.username);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !/^[A-Za-z0-9_]{3,30}$/.test(username)) {
        errors.push('username: 3-30 символа, само букви, цифри и _');
    }
    if (password.length < 8 || password.length > 72) {
        errors.push('password: между 8 и 72 символа');
    }
    return { errors, value: { username, password } };
}

module.exports = { validateGame, validateCredentials };