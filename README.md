# Голосование Олимпиады

Мобильный сайт голосования за кандидатов: открывается по QR, без логина, **один голос с устройства**.

Стек: **Next.js 15** (App Router) + API routes. Хранение голосов:

- локально / на обычном Node-хосте — файл `.data/votes.json`;
- на Vercel / serverless — [Upstash Redis](https://upstash.com) (бесплатный tier).

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

Сборка:

```bash
npm run build && npm start
```

## Название мероприятия / школы

Текст шапки в [`data/event.json`](data/event.json):

```json
{
  "title": "Голосование Олимпиады",
  "organization": "КГУ «Школа-гимназия № 118» г.Алматы"
}
```

## Кандидаты

Список в [`data/candidates.json`](data/candidates.json):

```json
[
  {
    "id": "maxim-frank",
    "name": "Максим Франк",
    "photo": "/candidates/maxim-frank.jpg",
    "grade": "8 А класс",
    "sport": "Вольная борьба"
  }
]
```

Чтобы поменять кандидатов: отредактируйте файл (`id`, `name`, `photo`, `grade`, `sport`), задеплойте заново.  
`grade` и `sport` показываются под именем (можно оставить пустыми).  
Фото кладите в [`public/candidates/`](public/candidates/) (JPG/PNG/WebP/SVG) и укажите путь вида `/candidates/имя-файла.jpg`.  
Если меняете `id` уже после старта голосования, старые голоса по старому id останутся в хранилище — лучше менять до старта или сбросить store.

Альтернатива через env не нужна: один JSON-файл проще править.

## Один голос с устройства

1. При первом визите клиент создаёт UUID и пишет его в **localStorage** и **cookie** (`olympiad_device_id`).
2. При голосовании `deviceId` уходит на `POST /api/vote`.
3. Сервер проверяет, голосовало ли это устройство; если да — отвечает `409 already_voted` и показывает результаты.
4. Cookie дополнительно выставляется с сервера после голоса.

Ограничение не криптографическое (очистка данных браузера / другой браузер = новое устройство). Этого достаточно для офлайн-мероприятия по QR.

## API

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/candidates` | Список кандидатов |
| `GET` | `/api/status` | Статус устройства + текущие счётчики (`x-device-id` или cookie) |
| `POST` | `/api/vote` | `{ deviceId, candidateId }` — отдать голос |
| `GET` | `/api/results` | Счётчики для всех кандидатов |

## QR-код

Страница [`/qr`](http://localhost:3000/qr) генерирует QR на текущий origin (или на `NEXT_PUBLIC_SITE_URL`) и даёт скачать PNG.

После деплоя:

1. Задайте `NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app`
2. Откройте `/qr` → «Скачать PNG» → распечатайте

Вручную (если URL уже известен):

```bash
npx --yes qrcode "https://your-app.vercel.app" -o olympiad-qr.png
```

## Переменные окружения

См. [`.env.example`](.env.example).

| Переменная | Обязательно | Назначение |
|------------|-------------|------------|
| `UPSTASH_REDIS_REST_URL` | для serverless-прод | Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | для serverless-прод | Redis REST token |
| `NEXT_PUBLIC_SITE_URL` | рекомендуется после деплоя | Канонический URL для QR |

Без Upstash приложение работает на файловом store — подходит для `npm run dev` / `npm start` на одном инстансе. На Vercel без Redis голоса **не** будут стабильно сохраняться между инстансами — подключите Upstash.

## Деплой на Vercel

1. Импортируйте репозиторий в [Vercel](https://vercel.com).
2. Создайте базу на [Upstash](https://console.upstash.com/) → Redis → скопируйте REST URL и TOKEN.
3. В настройках проекта Vercel добавьте env:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `NEXT_PUBLIC_SITE_URL` = ваш домен Vercel
4. Deploy.
5. Откройте `https://<домен>/qr` и скачайте QR.

Framework Preset: Next.js. Build: `next build`. Output: стандартный.

## Деплой на Cloudflare Pages

Next.js на Cloudflare удобнее через [`@cloudflare/next-on-pages`](https://developers.cloudflare.com/pages/framework-guides/nextjs/) или OpenNext.  
Для Cloudflare проще оставить Vercel+Upstash, либо адаптировать store под Cloudflare KV / D1 (интерфейс уже изолирован в `src/lib/store.ts`).

## Сброс голосов

- Файл: удалите `.data/votes.json`.
- Redis: удалите ключи `olympiad:devices` и `olympiad:counts` в консоли Upstash.
