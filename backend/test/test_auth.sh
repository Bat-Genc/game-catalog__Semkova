#!/bin/bash
B=http://localhost:3000/api
JSON="Content-Type: application/json"
BODY='{"username":"demo_user","password":"parola123"}'

echo "--- препоръки без вход (очаквам basedOn: trending)"
curl -s "$B/recommendations" | head -c 80; echo

TOKEN=$(curl -s -X POST $B/auth/register -H "$JSON" -d "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  TOKEN=$(curl -s -X POST $B/auth/login -H "$JSON" -d "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi
echo "токен: ${TOKEN:0:20}..."

echo "--- без токен (очаквам 401)"
curl -s -o /dev/null -w "%{http_code}\n" $B/me

echo "--- харесване на 23 и 24 (очаквам 204 204)"
curl -s -o /dev/null -w "%{http_code}\n" -X PUT $B/games/23/like -H "Authorization: Bearer $TOKEN"
curl -s -o /dev/null -w "%{http_code}\n" -X PUT $B/games/24/like -H "Authorization: Bearer $TOKEN"

echo "--- харесани"
curl -s $B/me/likes -H "Authorization: Bearer $TOKEN" | grep -o '"title":"[^"]*"'

echo "--- препоръки с вход (очаквам basedOn: likes)"
curl -s $B/recommendations -H "Authorization: Bearer $TOKEN" | head -c 80; echo