const { TWITCH_CLIENT_ID: ID, TWITCH_CLIENT_SECRET: SECRET } = process.env;

(async () => {
    const t = await (await fetch(`https://id.twitch.tv/oauth2/token?client_id=${ID}&client_secret=${SECRET}&grant_type=client_credentials`, { method: 'POST' })).json();
    const h = { 'Client-ID': ID, 'Authorization': `Bearer ${t.access_token}`, 'Accept': 'application/json' };
    for (const ep of ['age_rating_organizations', 'age_rating_categories']) {
        const r = await fetch(`https://api.igdb.com/v4/${ep}`, { method: 'POST', headers: h, body: 'fields *; limit 200;' });
        const data = await r.json();
        console.log('\n' + ep, r.status);
        if (Array.isArray(data)) data.forEach(x => console.log(JSON.stringify(x)));
        else console.log(data);
    }
})();