# Задачи за Frontend (Kirashki)

API: http://localhost:3000/api
Общият брой игри за текущия филтър е в хедъра `X-Total-Count`.

## Игри
- GET /games: параметри `search`, `studio` (част от името), `minRating`, `sort=year|rating`, `genre`, `pegi` (до тази възраст включително), `limit`, `page`
- GET /games/:id: една игра
- GET /genres: [{name, count}] за падащото меню (изборът се праща като ?genre=<име>, през URLSearchParams)
- GET /trending: 24 игри
- GET /recommendations: {basedOn: "likes"|"trending", games: [...]}

## Полета на играта
id, title, studio, year, rating (СТРИНГ, ползвай parseFloat), image_url, steam_url, igdb_url,
summary, genres, platforms, screenshots (масив), pegi_age, age_synopsis (английски, официален),
content_explanation (български, само за ~249 игри), guide, official_tags, epic_url.
Всяко поле може да е null: показвай го само когато има стойност.

## Профил (токенът е в localStorage)
- POST /auth/register и /auth/login с {username, password} -> {token, user}
- Заявки с вход: хедър `Authorization: Bearer <token>`
- GET /me, GET /me/likes
- PUT /games/:id/like и DELETE /games/:id/like (204)
- POST /auth/logout (204), после се трие токенът
- При 401: изтрий токена и покажи формата за вход

## За направа
1. "Зареди още" по 24 карти; скрива се при shown >= X-Total-Count
2. При промяна на търсене/филтър: page=1 и изчистване на списъка
3. Прозорец с подробности (<dialog>): корица, кадри, описание, жанрове, платформи, PEGI значка, content_explanation, age_synopsis, бутони към Steam и igdb.com
4. Текстово поле за студио (вместо меню), падащи менюта за жанр и PEGI
5. Табове: Top rated (sort=rating), Trending, За теб (препоръки)
6. Вход/регистрация, сърце за харесване, изход с confirm('Сигурен ли си, че искаш да излезеш?')
7. Скриване на празното "Упътване"; ако няма content_explanation, само PEGI значка
8. Корицата е портретна: aspect-ratio 3/4 или object-fit: contain

## Как се пуска бекендът
docker compose up -d (изчакай 20 сек), после в backend: npm install, node scripts/seed.js, node scripts/explain_bot.js --apply, node --env-file=.env server.js
В backend/.env: JWT_SECRET, DB_PASSWORD=studentpass, CORS_ORIGIN=<адресът на frontend-а, напр. http://localhost:5000>