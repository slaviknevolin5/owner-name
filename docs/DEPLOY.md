# Постоянный деплой (Vercel + Upstash)

Временный Cloudflare Tunnel живёт только пока работает Cloud Agent.
Для QR, который не «умирает», нужен Vercel + Redis.

## 1. Vercel

1. Открой [vercel.com/new](https://vercel.com/new), войди через GitHub.
2. Import `slaviknevolin5/owner-name`.
3. Production Branch: `cursor/olympiad-voting-site-b180` (или `main` после merge [PR #1](https://github.com/slaviknevolin5/owner-name/pull/1)).
4. Framework Preset: **Next.js**. Build: `next build`.
5. После первого деплоя скопируй URL: `https://<имя>.vercel.app`.

## 2. Upstash Redis (обязательно для голосов)

На serverless без Redis голоса **не** сохраняются стабильно.

1. [console.upstash.com](https://console.upstash.com) → Create Database → Redis → Free.
2. Вкладка **REST API** → скопируй:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## 3. Env на Vercel

Project → **Settings → Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `UPSTASH_REDIS_REST_URL` | из Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | из Upstash |
| `NEXT_PUBLIC_SITE_URL` | `https://<имя>.vercel.app` |

Затем **Redeploy**.

## 4. QR

Открой `https://<имя>.vercel.app/qr` → «Скачать PNG»  
или скажи URL агенту — обновим файл в `media/olympiad-vote-qr.png`.

## Проверка

- Главная открывается и листаются кандидаты.
- Голос засчитывается; после обновления страницы — «уже проголосовали».
- `GET /api/status` в ответе: `"backend":"redis"`.

## Локально

Без Upstash голоса пишутся в `.data/votes.json` (только один Node-процесс).
