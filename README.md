# 🎮 Каталог за компютърни игри (Задание No4 - Екип 4)

Уеб платформа с каталог от 496 компютърни игри: търсене, филтри, страниране, официални PEGI възрасти, обяснения на български, профили, харесвания, trending и препоръки.

## 📝 Описание
* **Функционални:** игра със заглавие, студио, година, рейтинг, корица, описание, жанрове, платформи, кадри, PEGI възраст, официален PEGI текст и линкове към Steam/IGDB. Търсене по име и студио, филтри по рейтинг, PEGI и жанр, сортиране, страниране, пълен CRUD за игрите, регистрация и вход, харесване на игри, trending и препоръки по жанровете на харесаните.
* **Нефункционални:** адаптивен Mobile-First дизайн (CSS Grid), lazy loading на изображенията, UTF-8 (`utf8mb4`), хеширани пароли (bcrypt), ограничение на опитите за вход, валидация на входа, CORS и тайни в `.env`.

## 🛠 Технологичен стек (KISS)
* **База данни:** MySQL 8.0 (Docker) + Adminer
* **Backend:** Node.js, Express, `mysql2`, `cors`, `bcryptjs`, `jsonwebtoken`, `express-rate-limit`
* **Frontend:** Vanilla JavaScript, HTML5, CSS3
* **Тестове и CI:** `node:test`, GitHub Actions, `backend/test/test_all.sh`

## 🚀 Стартиране

1. Създайте `backend/.env`:
   ```text
   JWT_SECRET=дълъг_случаен_низ
   DB_PASSWORD=studentpass
   CORS_ORIGIN=http://localhost:5000
   ```
   Генериране на тайна: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   В `CORS_ORIGIN` сложете адреса, на който върви frontend-ът.
2. База данни (след старта изчакайте ~20 секунди):
   ```bash
   docker compose up -d
   ```
3. Данни и сървър:
   ```bash
   cd backend
   npm install
   node scripts/seed.js
   node scripts/explain_bot.js --apply
   node --env-file=.env server.js
   ```
4. Frontend (нов терминал):
   ```bash
   npx serve frontend
   ```

> `docker compose down -v` изтрива базата (и потребителите). След него повторете стъпки 2-3.

## 🔌 API (http://localhost:3000/api)

| Метод | Адрес | Описание |
|-------|-------|----------|
| GET | `/games` | `search`, `studio`, `minRating`, `sort=year\|rating`, `genre`, `pegi`, `limit`, `page` |
| GET | `/games/:id` | Една игра |
| POST | `/games` | Добавяне (валидирано) |
| PUT, DELETE | `/games/:id` | Редакция и изтриване (с вход) |
| GET | `/genres` | Жанрове с брой игри |
| POST | `/auth/register`, `/auth/login` | Профил, връща JWT |
| POST | `/auth/logout` | Анулира токена |
| GET | `/me`, `/me/likes` | Профил и харесани (с вход) |
| PUT, DELETE | `/games/:id/like` | Харесване / махане (с вход) |
| GET | `/trending` | Най-харесвани последните 7 дни |
| GET | `/recommendations` | По жанрове на харесаните; иначе trending |

Общият брой игри е в хедъра `X-Total-Count`. Вход: `Authorization: Bearer <token>`.

## 📦 Данни
IGDB (еднократно): `scripts/fetch_igdb.js` → `scripts/clean.js` → `data/games_clean.json` → `scripts/seed.js`. Българските обяснения (`data/explanations.json`) са превод на официалните PEGI дескриптори, прегледани ръчно; игри без официален текст показват само PEGI възрастта.

## ✅ Тестове
* `cd backend && npm test`: 18 unit теста (node:test), пуска се и от CI
* `bash backend/test/test_all.sh` при работещ сървър: 36 проверки на целия API

## 📂 Структура
* `/db` - SQL за инициализация
* `/backend`
  * `server.js` - входна точка
  * `src/` - `query.js`, `validate.js`, `users.js`
  * `scripts/` - `fetch_igdb.js`, `clean.js`, `seed.js`, `explain_bot.js`
  * `data/` - `games_clean.json`, `explanations.json`
  * `test/` - unit тестове, `test_all.sh`, `test_auth.sh`
* `/frontend` - HTML, CSS, JS
* `/docs` - прогрес и задачи на екипа
* `docker-compose.yml`

## 📚 Документация
* [Прогрес](docs/PROGRESS.txt)
* [Задачи Backend](docs/tasks/Bat_Genc_Tasks.md)
* [Задачи Frontend](docs/tasks/KIRASHKI.md)
* [Обща задача](docs/tasks/TASKS.md)

## 🔮 Бъдещо развитие
Проверка "ще ми тръгне ли играта", роли за PUT/DELETE, черен списък на токените в базата, истински trending с периодично обновяване.

![alt text](image.png)