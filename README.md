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

## ADMIN_SECRET na CRON_SECRET (maelezo kamili)

### ADMIN_SECRET

- **Si** kutoka Google wala Firebase. Ni nenosiri **unalojiandikia wewe** kwenye `.env` (herufi 24+ ngumu, bora random).
- Server anahifadhi thamani moja; unapoongeza/futa ratiba kutoka UI, kivinjari kinatuma neno hilo kwenye kichwa cha HTTP **`x-admin-secret`**.
- Ikiwa kinalingana na `ADMIN_SECRET` kwenye server, ombi linaruhusiwa. **Lengo:** mtu asiye na neno asibadilishe ratiba zako.
- Ukibaki **bila** `ADMIN_SECRET` kwenye `.env`, API ya ratiba ni wazi (tumia tu kwa local / ndani ya mtandao unaoamini).

### CRON_SECRET

- Pia **wewe hutengeneza** (haitolewi na huduma ya nje). Weka **sawa sawa** kwenye `.env` na kwenye **Vercel → Settings → Environment Variables**.
- Vercel Cron inapopiga endpoint yako, inatuma: `Authorization: Bearer <thamani ya CRON_SECRET>`. Server inalinganisha na mazingira — hiyo ndiyo “mfumo anavyojua” ni ombi halali.

### Kiungo (URL) cha cron job

- **Path ya API (ndogo):** `/api/cron`
- **URL kamili:** mstari wa domain yako ya deployment **+** `/api/cron`

Mifano (badilisha na domain yako halisi):

| Mazingira | URL mfano |
|-----------|-----------|
| Vercel (kila project) | `https://<jina-lako>.vercel.app/api/cron` |
| Domain maalum | `https://notify.example.com/api/cron` |
| Local | `http://localhost:3000/api/cron` |

**Kumbuka:** Vercel ha “toa” kiungo kingine: wewe huona URL ya tovuti yako kwenye dashboard; cron job iliyowekwa kwenye `vercel.json` ina **path** `"/api/cron"` — Vercel ndiyo hupiga **URL kamili** (= domain ya project + path hiyo) kiotomatiki endapo umeamilisha Cron kwenye project.

Jaribio kwa mkono (badilisha domain na siri):

```bash
curl -s -H "Authorization: Bearer JINSI_YA_CRON_SECRET" "https://JINA-LAKO.vercel.app/api/cron"
```

### Local (PC)

Ratiba hutekelezwa **kila dakika** na `server-local.js` bila kuhitaji kuipiga `/api/cron`. `CRON_SECRET` unahitajika hasa uki-host Vercel au unapotaka kujaribu `/api/cron` kwa `curl`.

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
- UI inahitaji `ADMIN_SECRET` ukiwa umeuweka kwenye `.env` (weka kwenye fomu — inahifadhiwa session). Maelezo ya kina: sehemu ya **ADMIN_SECRET na CRON_SECRET** hapo juu.

### Vercel / serverless

Diski ya Vercel **haina kudumu** kwa kuandika faili: ratiba zinaweza **kupotea** baada ya deploy au kati ya invocations. Kwa production kwenye Vercel, tafadhali tumia **hifadhi ya nje** (KV, Postgres, n.k.) au host Node yenye diski (VPS). `npm run dev` na VPS zinafanya kazi na JSON ya kawaida.

### Cron ya Vercel

`vercel.json` ina cron kila **dakika 5** inayolenga path **`/api/cron`**. Weka `CRON_SECRET` kwenye Environment Variables ya Vercel. URL halisi ni **`https://<domain-yako>/api/cron`** — ona jedwali kwenye sehemu **Kiungo cha cron job** hapo juu.

---

## API fupi

| Njia | Kazi |
|------|------|
| `GET /api/meta` | `siteName`, `topic`, `scheduleTz`, `adminRequired`, `cronConfigured` |
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
