# ⚙️ Backend & Database Tasks (Bat_Genc)

## 🗄️ База данни (MySQL)
* Таблица `games` съдържа: `id`, `title`, `studio`, `year`, `guide`, `rating`, `image_url`.
* Инициализация чрез `db/init.sql` с `SET NAMES utf8mb4;` за правилна кирилица.

## 🔌 API Calls (Endpoints)
Всички заявки се правят към `http://localhost:3000/api/games`.

1. **Взимане на всички игри:**
   * `GET /api/games`
   * Връща JSON масив с всички игри, подредени по рейтинг (низходящо).

2. **Търсене по име:**
   * `GET /api/games?search=witcher`
   * SQL: `SELECT * FROM games WHERE title LIKE '%witcher%'`

3. **Филтриране по студио:**
   * `GET /api/games?studio=CD Projekt Red`
   * SQL: `SELECT * FROM games WHERE studio = 'CD Projekt Red'`

4. **Филтриране по минимален рейтинг:**
   * `GET /api/games?minRating=9.0`
   * SQL: `SELECT * FROM games WHERE rating >= 9.0`

## 🐳 Docker & Среда
* `docker compose up -d` стартира MySQL (порт 3306) и Adminer (порт 8080).
* `cd backend && node server.js` стартира сървъра (порт 3000).