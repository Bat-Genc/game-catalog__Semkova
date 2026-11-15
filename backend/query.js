function buildGamesQuery(q = {}) {
    const { search, studio, minRating, sort } = q;
    let where = ' WHERE 1=1';
    const params = [];

    if (search) { where += ' AND title LIKE ?'; params.push(`%${search}%`); }
    if (studio) { where += ' AND studio = ?'; params.push(studio); }
    if (minRating) { where += ' AND rating >= ?'; params.push(parseFloat(minRating)); }

    // вторият критерий (id) пази реда стабилен между страниците
    const order = sort === 'year' ? ' ORDER BY year DESC, id' : ' ORDER BY rating DESC, id';
    let sql = 'SELECT * FROM games' + where + order;

    const limit = parseInt(q.limit, 10);
    if (limit > 0) {
        const size = Math.min(limit, 100);
        const page = Math.max(parseInt(q.page, 10) || 1, 1);
        sql += ` LIMIT ${size} OFFSET ${(page - 1) * size}`;
    }

    return { sql, countSql: 'SELECT COUNT(*) AS total FROM games' + where, params };
}

module.exports = { buildGamesQuery };