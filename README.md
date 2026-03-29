# web-notify

Tovuti ndogo ya kutuma arifa kupitia **Firebase Cloud Messaging (HTTP v1)** — `data`: `title`, `body`, `image`. Ina **tuma sasa** na **ratiba** (mara moja au kila siku), hifadhi **JSON** ya ndani.

**GitHub:** [https://github.com/basanzietech/web-notify](https://github.com/basanzietech/web-notify)

---

## Mazingira (`.env` / Vercel)

Badilisha tu `.env` kwa kila mradi (jina, topic, siri):

| Variable | Maana |
|----------|--------|
| `SITE_NAME` | Jina linaonekana kwenye kichwa cha ukurasa |
| `FCM_TOPIC` | Topic thabiti ya FCM (mfano `BETMAKINI`) |
| `SCHEDULE_TZ` | Kanda ya wakati kwa ratiba ya kila siku (mfano `Africa/Nairobi`) |
| `SCHEDULE_DB_PATH` | (Chaguo) njia ya faili ya JSON; chaguo-msingi `data/schedules.json` |
| `ADMIN_SECRET` | Siri ya kuongeza/futa ratiba kwenye API; ikiwa tupu, API ya ratiba **wazi** |
| `CRON_SECRET` | Siri ya `/api/cron` (Vercel Cron inatumia Bearer hii) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` au `GOOGLE_APPLICATION_CREDENTIALS` | Firebase service account |

Nakili `.env.example` → `.env.local` na ujaze thamani halisi.

---

## Usalama na repo ya kibinafsi

- Repo **Private** kwenye GitHub.
- **Usicommit:** `service-account.json`, `.env*`, `data/*.json` ya ratiba, `google-services.json`, funguo.
- Topic na jina la tovuti zinatoka **server** (`FCM_TOPIC`, `SITE_NAME`); mteja hawezi kubadilisha topic kwa njia ya siri.

---

## Mahitaji

- Node.js 18+
- Firebase **Service Account** na FCM v1

---

## Local

```bash
cd web-notify
npm install
cp .env.example .env.local
# Hariri .env.local
npm run dev
```

Fungua `http://localhost:3000`. Server inaangalia ratiba **kila dakika** moja kwa moja.

---

## Ratiba na JSON

- Faili: chaguo-msingi `data/schedules.json` (haijacommitwi).
- **Mara moja:** `runAt` (ISO).
- **Kila siku:** saa `HH:mm` kwa `SCHEDULE_TZ`.
- UI inahitaji `ADMIN_SECRET` ukiwa umeuweka kwenye `.env` (weka kwenye fomu — inahifadhiwa session).

### Vercel / serverless

Diski ya Vercel **haina kudumu** kwa kuandika faili: ratiba zinaweza **kupotea** baada ya deploy au kati ya invocations. Kwa production kwenye Vercel, tafadhali tumia **hifadhi ya nje** (KV, Postgres, n.k.) au host Node yenye diski (VPS). `npm run dev` na VPS zinafanya kazi na JSON ya kawaida.

### Cron ya Vercel

`vercel.json` ina cron kila **dakika 5** inayopiga `/api/cron`. Weka `CRON_SECRET` kwenye Environment Variables ya Vercel; Vercel inatuma `Authorization: Bearer <CRON_SECRET>` wakati wa cron.

Unaweza pia kupiga mkono: `curl -H "Authorization: Bearer JINSI_YA_CRON_SECRET" https://your-app.vercel.app/api/cron`

---

## API fupi

| Njia | Kazi |
|------|------|
| `GET /api/meta` | `siteName`, `topic`, `scheduleTz`, `adminRequired` |
| `POST /api/send` | Tuma sasa (`title`, `body`, `image`) |
| `GET/POST /api/schedule` | Orodha (GET); ongeza/futa/washa (POST + `x-admin-secret`) |
| `GET/POST /api/cron` | Tekeleza ratiba zilizofika (Bearer `CRON_SECRET`) |

---

## Muundo wa mradi

| Sehemu | Faili |
|--------|--------|
| UI | `public/index.html` |
| API | `api/send.js`, `api/meta.js`, `api/schedule.js`, `api/cron.js` |
| FCM | `lib/fcmSend.js` |
| Ratiba | `lib/scheduleStore.js`, `lib/scheduleEngine.js`, `lib/scheduleController.js` |
| Config | `lib/config.js` |
| Local | `server-local.js` |

---

## Leseni

Code ya mradi wako; tumia kulingana na sera yako.
