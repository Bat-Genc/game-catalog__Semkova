const test = require('node:test');
const assert = require('node:assert');
const { buildGamesQuery } = require('../src/query');

test('без параметри: сортира по рейтинг и няма LIMIT', () => {
    const { sql, params } = buildGamesQuery({});
    assert.ok(sql.endsWith('ORDER BY rating DESC, id'));
    assert.ok(!sql.includes('LIMIT'));
    assert.deepStrictEqual(params, []);
});

test('sort=year', () => {
    assert.ok(buildGamesQuery({ sort: 'year' }).sql.endsWith('ORDER BY year DESC, id'));
});

test('непознат sort се връща към рейтинг', () => {
    assert.ok(buildGamesQuery({ sort: 'DROP TABLE' }).sql.endsWith('ORDER BY rating DESC, id'));
});

test('search и studio ползват LIKE', () => {
    const { sql, params } = buildGamesQuery({ search: 'witcher', studio: 'ubisoft' });
    assert.ok(sql.includes('title LIKE ?') && sql.includes('studio LIKE ?'));
    assert.deepStrictEqual(params, ['%witcher%', '%ubisoft%']);
});

test('minRating става число', () => {
    assert.deepStrictEqual(buildGamesQuery({ minRating: '9.2' }).params, [9.2]);
});

test('genre и pegi', () => {
    const { sql, params } = buildGamesQuery({ genre: 'RPG', pegi: '12' });
    assert.ok(sql.includes('genres LIKE ?') && sql.includes('pegi_age <= ?'));
    assert.deepStrictEqual(params, ['%RPG%', 12]);
});

test('limit и page: LIMIT 24 OFFSET 48', () => {
    assert.ok(buildGamesQuery({ limit: '24', page: '3' }).sql.endsWith('LIMIT 24 OFFSET 48'));
});

test('limit е ограничен до 100, а page под 1 става 1', () => {
    assert.ok(buildGamesQuery({ limit: '5000', page: '-4' }).sql.endsWith('LIMIT 100 OFFSET 0'));
});

test('countSql няма ORDER BY и LIMIT, но има същите условия', () => {
    const { countSql, params } = buildGamesQuery({ genre: 'RPG', limit: '24' });
    assert.ok(countSql.startsWith('SELECT COUNT(*)'));
    assert.ok(!countSql.includes('ORDER BY') && !countSql.includes('LIMIT'));
    assert.ok(countSql.includes('genres LIKE ?'));
    assert.deepStrictEqual(params, ['%RPG%']);
});