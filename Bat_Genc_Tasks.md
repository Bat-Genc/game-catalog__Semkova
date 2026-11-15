# ⚙️ Backend & Database Tasks (Bat_Genc)

## 🗄️ База данни (MySQL)
* Таблица `games` съдържа: `id`, `title`, `studio`, `year`, `guide`, `rating`, `image_url`.
* Нови колони:
  * `official_tags` - официални тагове (напр. "Violence, Bad Language")
  * `content_explanation` - обяснение на български какво означават таговете
  * `steam_url` - линк към Steam
  * `epic_url` - линк към Epic Games
* Инициализация чрез `db/init.sql` с `SET NAMES utf8mb4;` за правилна кирилица.
* След промяна на схемата: `docker compose down -v`, после `docker compose up -d`.

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

5. **Сортиране:**
   * `GET /api/games?sort=year` - най-новите игри първи (`ORDER BY year DESC`)
   * Без параметър - по рейтинг (`ORDER BY rating DESC`)
   * Параметрите могат да се комбинират: `?studio=Team Cherry&sort=year`

6. **Добавяне на игра (CRUD демо):**
   * `POST /api/games` с JSON тяло (задължителни: `title`, `studio`)
   * Връща `201` и `{ "id": <ново id> }`

## 📦 JSON полета към Frontend
`id`, `title`, `studio`, `year`, `guide`, `rating`, `image_url`, `official_tags`, `content_explanation`, `steam_url`, `epic_url`

* `rating` идва като низ (`"9.7"`), затова при нужда се ползва `parseFloat()`.
* `steam_url`, `epic_url` и други полета могат да са `null`, затова се проверяват преди показване.

## 🐳 Docker & Среда
* `docker compose up -d` стартира MySQL (порт 3306) и Adminer (порт 8080).
* `cd backend && node server.js` стартира сървъра (порт 3000).

## ✅ Статус
- [x] Обновен `db/init.sql` с новите колони и данни
- [x] Сортиране `?sort=year`
- [x] `POST /api/games`
- [x] Тествани всички endpoint-и с `curl`
- [x] Колегата е уведомен за новите JSON ключове