#!/bin/bash
B=http://localhost:3000/api
J="Content-Type: application/json"
PASS=0; FAIL=0

check() { # име, очаквано, получено
  if [ "$2" == "$3" ]; then echo "OK   $1"; PASS=$((PASS+1))
  else echo "FAIL $1 (очаквано: $2, получено: $3)"; FAIL=$((FAIL+1)); fi
}
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
total() { curl -si "$1" | grep -i '^x-total-count' | tr -d '\r' | awk '{print $2}'; }
gt() { [ "$2" -gt "$1" ] 2>/dev/null && echo yes || echo no; }

echo "== Игри"
check "GET /games 200" 200 "$(code $B/games)"
check "X-Total-Count = 496" 496 "$(total "$B/games?limit=24&page=1")"
check "limit=24 връща 24" 24 "$(curl -s "$B/games?limit=24&page=2" | grep -o '"id"' | wc -l)"
check "последна страница = 16" 16 "$(curl -s "$B/games?limit=24&page=21" | grep -o '"id"' | wc -l)"
check "студио LIKE (ubisoft > 20)" yes "$(gt 20 "$(total "$B/games?studio=ubisoft&limit=1")")"
check "pegi=12 по-малко от 496" yes "$( [ "$(total "$B/games?pegi=12&limit=1")" -lt 496 ] && echo yes || echo no)"
check "genre=RPG по-малко от 496" yes "$( [ "$(total "$B/games?genre=RPG&limit=1")" -lt 496 ] && echo yes || echo no)"
check "GET /games/23 200" 200 "$(code $B/games/23)"
check "GET /games/99999 404" 404 "$(code $B/games/99999)"
check "GET /games/abc 400" 400 "$(code $B/games/abc)"
check "GET /genres 200" 200 "$(code $B/genres)"

echo "== Валидация на POST"
check "POST невалидна -> 400" 400 "$(code -X POST $B/games -H "$J" -d '{"title":"","studio":"X","year":1800}')"
GID=$(curl -s -X POST $B/games -H "$J" -d '{"title":"ТестИгра","studio":"Test","year":2024,"rating":8}' | grep -o '"id":[0-9]*' | cut -d: -f2)
check "POST валидна -> има id" yes "$( [ -n "$GID" ] && echo yes || echo no)"

echo "== Профил"
U="test_$RANDOM"
BODY="{\"username\":\"$U\",\"password\":\"parola123\"}"
TOKEN=$(curl -s -X POST $B/auth/register -H "$J" -d "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
check "регистрация връща токен" yes "$( [ -n "$TOKEN" ] && echo yes || echo no)"
check "дублирано име -> 409" 409 "$(code -X POST $B/auth/register -H "$J" -d "$BODY")"
check "къса парола -> 400" 400 "$(code -X POST $B/auth/register -H "$J" -d '{"username":"abc_def","password":"123"}')"
check "грешна парола -> 401" 401 "$(code -X POST $B/auth/login -H "$J" -d "{\"username\":\"$U\",\"password\":\"greshna123\"}")"
check "login 200" 200 "$(code -X POST $B/auth/login -H "$J" -d "$BODY")"
check "/me без токен -> 401" 401 "$(code $B/me)"
check "/me с токен -> 200" 200 "$(code $B/me -H "Authorization: Bearer $TOKEN")"

echo "== Харесвания, препоръки"
check "like -> 204" 204 "$(code -X PUT $B/games/23/like -H "Authorization: Bearer $TOKEN")"
check "like несъществуваща -> 404" 404 "$(code -X PUT $B/games/99999/like -H "Authorization: Bearer $TOKEN")"
check "like без токен -> 401" 401 "$(code -X PUT $B/games/23/like)"
check "/me/likes съдържа Elden Ring" yes "$(curl -s $B/me/likes -H "Authorization: Bearer $TOKEN" | grep -q 'Elden Ring' && echo yes || echo no)"
check "препоръки с вход = likes" yes "$(curl -s $B/recommendations -H "Authorization: Bearer $TOKEN" | grep -q '"basedOn":"likes"' && echo yes || echo no)"
check "препоръки без вход = trending" yes "$(curl -s $B/recommendations | grep -q '"basedOn":"trending"' && echo yes || echo no)"
check "unlike -> 204" 204 "$(code -X DELETE $B/games/23/like -H "Authorization: Bearer $TOKEN")"
check "/trending 200" 200 "$(code $B/trending)"

echo "== PUT и DELETE на игри"
check "PUT без токен -> 401" 401 "$(code -X PUT $B/games/$GID -H "$J" -d '{"title":"X","studio":"Y"}')"
check "PUT с токен -> 200" 200 "$(code -X PUT $B/games/$GID -H "$J" -H "Authorization: Bearer $TOKEN" -d '{"title":"ТестИгра2","studio":"Test"}')"
check "DELETE без токен -> 401" 401 "$(code -X DELETE $B/games/$GID)"
check "DELETE с токен -> 204" 204 "$(code -X DELETE $B/games/$GID -H "Authorization: Bearer $TOKEN")"
check "DELETE повторно -> 404" 404 "$(code -X DELETE $B/games/$GID -H "Authorization: Bearer $TOKEN")"

echo "== Изход"
check "logout -> 204" 204 "$(code -X POST $B/auth/logout -H "Authorization: Bearer $TOKEN")"
check "токенът след logout -> 401" 401 "$(code $B/me -H "Authorization: Bearer $TOKEN")"

echo "== CORS"
check "чужд адрес няма разрешение" yes "$(curl -si $B/games?limit=1 -H 'Origin: http://evil.example' | grep -qi 'access-control-allow-origin' && echo no || echo yes)"

echo; echo "Минали: $PASS, неуспешни: $FAIL"