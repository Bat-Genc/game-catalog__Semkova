const test = require('node:test');
const assert = require('node:assert');
const { validateGame, validateCredentials } = require('../validate');

test('валидна игра: подрязва интервали и закръгля рейтинга', () => {
    const { errors, value } = validateGame({ title: '  Тест  ', studio: 'S', year: '2024', rating: 8.46 });
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(value.title, 'Тест');
    assert.strictEqual(value.year, 2024);
    assert.strictEqual(value.rating, 8.5);
});

test('липсващи полета стават null', () => {
    const { value } = validateGame({ title: 'A', studio: 'B' });
    assert.strictEqual(value.year, null);
    assert.strictEqual(value.guide, null);
});

test('празно заглавие и студио са грешка', () => {
    const { errors } = validateGame({ title: ' ', studio: '' });
    assert.strictEqual(errors.length, 2);
});

test('година и рейтинг извън граници', () => {
    const { errors } = validateGame({ title: 'A', studio: 'B', year: 1800, rating: 11 });
    assert.strictEqual(errors.length, 2);
});

test('javascript: адрес се отхвърля', () => {
    const { errors } = validateGame({ title: 'A', studio: 'B', steam_url: 'javascript:alert(1)' });
    assert.ok(errors.some(e => e.includes('steam_url')));
});

test('https адрес минава', () => {
    const { errors } = validateGame({ title: 'A', studio: 'B', steam_url: 'https://store.steampowered.com/app/1/' });
    assert.deepStrictEqual(errors, []);
});

test('валидни данни за вход', () => {
    assert.deepStrictEqual(validateCredentials({ username: 'demo_user', password: 'parola123' }).errors, []);
});

test('късо потребителско име, къса и дълга парола', () => {
    assert.strictEqual(validateCredentials({ username: 'ab', password: 'parola123' }).errors.length, 1);
    assert.strictEqual(validateCredentials({ username: 'demo_user', password: '123' }).errors.length, 1);
    assert.strictEqual(validateCredentials({ username: 'demo_user', password: 'x'.repeat(73) }).errors.length, 1);
});

test('недопустими символи в потребителското име', () => {
    assert.ok(validateCredentials({ username: 'a b!', password: 'parola123' }).errors.length > 0);
});