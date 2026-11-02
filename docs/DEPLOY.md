# Постоянный деплой (Cloudflare Workers + KV)

Сайт на Next.js деплоится через **OpenNext → Cloudflare Workers** (современный путь для Next на CF; у свечей `*.pages.dev` — обычно статичный Pages, а здесь нужны API + KV).

## Актуальный preview (football theme)

1. Worker: `olympiad-vote`
2. KV binding: `OLYMPIAD_VOTES` (`24524d7e73934b029de4974475b5bd72`)
3. Preview URL: **https://olympiad-vote.scythe-denim.workers.dev**
4. QR: https://olympiad-vote.scythe-denim.workers.dev/qr
5. **Claim (сделать за ~60 мин, иначе пропадёт):**  
   https://dash.cloudflare.com/claim-preview?claimToken=iWNGcj7HxyUiaD2rt_VOYZXt6A98vPJYWZfmT_1GVzU

После claim сайт остаётся на твоём Cloudflare-аккаунте постоянно (как `minimavelas.pages.dev`, только домен будет `*.workers.dev` или свой).

> Предыдущий preview `olympiad-vote.glaze-anatosaurus.workers.dev` был claimed раньше; повторный деплой туда без `CLOUDFLARE_API_TOKEN` невозможен — поднят новый temporary Worker с футбольной темой и плавным слайдером.

## Минимальные шаги для тебя

1. Открой **Claim URL** выше → войди в Cloudflare (тот же аккаунт, что для свечей).
2. Подтверди claim preview account.
3. Проверь сайт в браузере / телефоне.
4. (Опционально) Workers & Pages → `olympiad-vote` → Settings → Domains → добавь свой домен / workers.dev.
5. Пришли финальный URL — обновим `NEXT_PUBLIC_SITE_URL` и QR.

## Env / bindings

| Имя | Где | Назначение |
|-----|-----|------------|
| `OLYMPIAD_VOTES` | KV binding в `wrangler.jsonc` | голоса + один голос с устройства |
| `NEXT_PUBLIC_SITE_URL` | build env / `.env` | канонический URL для `/qr` |

Upstash **не обязателен**, если есть KV.

## Повторный деплой (после claim + API token)

```bash
npx opennextjs-cloudflare build
npx wrangler deploy
```

Нужен `CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers) или `wrangler login`.

До claim можно так:

```bash
npx wrangler deploy --temporary
```

## Локально

```bash
npm install
npm run dev   # file store .data/votes.json
```

## Проверка

- Открывается главная, листаются кандидаты, голос пишется.
- Повторный голос с того же устройства блокируется.
- `GET /api/status` → `"backend":"kv"` на Cloudflare.
