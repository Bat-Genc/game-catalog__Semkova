# ⚙️ Backend & Database Tasks (Bat_Genc)

## 🗄️ База данни (MySQL)
* Таблица `games` (496 игри от IGDB, всички излизали на PC): `id`, `title`, `studio`, `year`, `rating`, `image_url`, `guide`, `official_tags`, `content_explanation`, `steam_url`, `epic_url`, `summary`, `genres`, `platforms`, `igdb_url`, `screenshots` (JSON), `pegi_age`, `age_synopsis`.
* Таблица `users` (`username`, `password_hash`) и `likes` (`user_id`, `game_id`, с `ON DELETE CASCADE`).
* Инициализация чрез `db/init.sql` с `SET NAMES utf8mb4;`.
* `content_explanation`: 249 обяснения на български, превод на официалните PEGI дескриптори и ръчно прегледани. Игри без официален текст показват само PEGI възрастта.

## 📥 Зареждане на данни
`fetch_igdb.js` (IGDB) → `clean.js` → `games_clean.json` → `seed.js` → `explain_bot.js --apply` (от `explanations.json`).

## 🔌 API (http://localhost:3000/api)
| Метод | Адрес | Описание |
|-------|-------|----------|
| GET | `/games` | `search`, `studio` (част от името), `minRating`, `sort=year\|rating`, `genre`, `pegi`, `limit`, `page`; общият брой е в `X-Total-Count` |
| GET | `/games/:id` | Една игра (400 / 404 при грешка) |
| POST | `/games` | Добавяне с валидация (`validate.js`) |
| PUT, DELETE | `/games/:id` | Редакция и изтриване (с вход) |
| GET | `/genres` | Жанрове с брой игри |
| POST | `/auth/register`, `/auth/login` | Профил, връща JWT |
| POST | `/auth/logout` | Анулира токена |
| GET | `/me`, `/me/likes` | Профил и харесани (с вход) |
| PUT, DELETE | `/games/:id/like` | Харесване / махане |
| GET | `/trending` | Най-харесвани последните 7 дни |
| GET | `/recommendations` | По жанровете на харесаните; иначе trending |

## 🔒 Сигурност
* Пароли с bcrypt, JWT за 12 часа, ограничение 20 опита на 15 минути.
* Валидация на входа и на URL адресите (само `http(s)`).
* Параметризирани SQL заявки.
* Парола на базата и CORS в `backend/.env` (`DB_PASSWORD`, `JWT_SECRET`, `CORS_ORIGIN`).

## 🧹 Чист код
* `withDb()` затваря връзката винаги, `query.js` и `validate.js` са отделени и тестваеми.
* CI през GitHub Actions (`node --test`).

## 🐳 Стартиране
```bash
docker compose up -d        # изчакай ~20 секунди
cd backend && npm install
node seed.js
node explain_bot.js --apply
node --env-file=.env server.js
```
`docker compose down -v` изтрива базата; повтори seed и `--apply`.

## ⚠️ Известни ограничения (бъдещо развитие)
* Анулираните токени са в паметта (изчистват се при рестарт).
* PUT/DELETE за игри са достъпни за всеки влязъл потребител (няма роли).
* Няма хардуерна проверка "ще ми тръгне ли играта".

## ✅ Статус
- [x] Страниране, филтри, сортиране, жанрове
- [x] Профили, харесвания, trending, препоръки
- [x] Пълен CRUD за игрите
- [x] `test_all.sh`: 36/36 проверки минават
- [ ] Unit тестове за `query.js` и `validate.js`
- [ ] Frontend (Kirashki): виж `KIRASHKI.md`