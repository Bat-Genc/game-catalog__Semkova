function buildGamesQuery(q = {}) {
    const { search, studio, minRating, sort, genre } = q;
    let where = ' WHERE 1=1';
    const params = [];

    if (search) { where += ' AND title LIKE ?'; params.push(`%${search}%`); }
    if (studio) { where += ' AND studio LIKE ?'; params.push(`%${studio}%`); }    
    if (minRating) { where += ' AND rating >= ?'; params.push(parseFloat(minRating)); }
    if (genre) { where += ' AND genres LIKE ?'; params.push(`%${genre}%`); }

    // ?pegi=16 -> игри с PEGI до 16 включително (игри без PEGI данни се изключват)
    const pegi = parseInt(q.pegi, 10);
    if (Number.isInteger(pegi)) {
        where += ' AND pegi_age IS NOT NULL AND pegi_age <= ?';
        params.push(pegi);
    }

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