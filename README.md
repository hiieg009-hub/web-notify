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
| `ADMIN_SECRET` | **Lazima** (isipokuwa `ADMIN_AUTH_OPEN=1`). Linazuia **kutuma** na **ratiba** bila `x-admin-secret` / Bearer |
| `ADMIN_AUTH_OPEN` | Weka `1` au `true` **dev tu** — API wazi bila `ADMIN_SECRET` (usitumie production) |
| `CRON_SECRET` | Siri ya `/api/cron` (Vercel Cron inatumia Bearer hii) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` au `GOOGLE_APPLICATION_CREDENTIALS` | Firebase service account |

Nakili `.env.example` → `.env.local` na ujaze thamani halisi.

---

## ADMIN_SECRET na CRON_SECRET (maelezo kamili)

### ADMIN_SECRET

- **Si** kutoka Google wala Firebase. Ni nenosiri **unalojiandikia wewe** kwenye `.env` (herufi 24+ ngumu, bora random).
- Server anahifadhi thamani moja. Kivinjari kinatuma neno hilo kwenye **`x-admin-secret`** (au `Authorization: Bearer …`) kwa:
  - **Kutuma arifa sasa** (`POST /api/send`)
  - **Ratiba** (GET/POST `/api/schedule`)
- Ikiwa kinalingana na `ADMIN_SECRET`, ombi linaruhusiwa. **Lengo:** mtu asiye na neno asitume notification wala asibadilishe ratiba.
- **Chaguo-msingi:** bila `ADMIN_SECRET` (na bila `ADMIN_AUTH_OPEN=1`), server inarudisha **503** — hakuna kutuma wala ratiba. Kwa jaribio la PC bila nenosiri, weka **`ADMIN_AUTH_OPEN=1`** (usitumie hadharani).

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

## Shared hosting na production

Mradi huu ni **Node.js** (sio PHP). **Shared hosting ya kawaida inayotoa tu PHP + MySQL** mara nyingi **haiendeshi** app hii bila kitu kingine.

### Ikiwa mwenyeji wako ana Node.js (cPanel “Node.js”, “Setup Node.js App”, n.k.)

1. **Sakinisho:** pakia faili za mradi (bila `node_modules`); kwenye server fanya `npm install --production` (SSH au zana ya mwenyeji).
2. **Mazingira:** weka `FIREBASE_SERVICE_ACCOUNT_JSON` na zingine kwenye **Environment Variables** ya panel, **si** ndani ya folda inayosomeka hadharani. Usiweke `public/` ndani ya `public_html` pekee ukisahau API — ufuata maelezo ya mwenyeji jinsi ya kuunganisha **reverse proxy** kutoka domain hadi mchakato wa Node (mara nyingi port ya ndani kama 3000).
3. **Kuanzisha app:** amri ya mwanzo iwe `node server-local.js` (au `PORT=xxxx node server-local.js` kama mwenyeji anataka port maalum). App lazima iendelee **24/7** (process isiyo zimwa); baadhi ya host hutumia **Passenger** au **PM2** — soma docs za mwenyeji.
4. **Ratiba (JSON):** hakikisha folda `data/` inaandika (permissions). Weka `SCHEDULE_DB_PATH` kamili **nje** ya `public_html` ikiwa inawezekana.
5. **Cron (chaguo):** `server-local.js` tayari inaangalia ratiba **kila dakika** muda process inapoendelea. Ikiwa host huzima process au unataka uhakika, weka **Cron** ya cPanel kila dakika 5 inayopiga URL yako ya production:
   `https://domain-yako.com/api/cron`  
   pamoja na header `Authorization: Bearer <CRON_SECRET>` (kama `curl` au zana inayoruhusu headers — cPanel mara nyingi `wget`/`curl` kwenye cron).

### Ikiwa **huna** Node kwenye shared hosting

Huna njia ya “kuiweka tu” kama faili za PHP. Chaguo rahisi kwa production:

- **Vercel / Netlify / Railway / Render** (Node au serverless)
- **VPS** ndogo (Hetzner, DigitalOcean, Contabo): Ubuntu + Node + `pm2` + Nginx reverse proxy

**Muhtasari:** shared hosting **ya PHP tu** = haifai moja kwa moja; tafuta **Node-enabled hosting** au **VPS / PaaS**.

---

## Ratiba na JSON

- Faili: chaguo-msingi `data/schedules.json` (haijacommitwi).
- **Mara moja:** `runAt` (ISO).
- **Kila siku:** saa `HH:mm` kwa `SCHEDULE_TZ`.
- UI inahitaji `ADMIN_SECRET` ukiwa umeuweka kwenye `.env` (weka kwenye fomu — inahifadhiwa session). Maelezo ya kina: sehemu ya **ADMIN_SECRET na CRON_SECRET** hapo juu.

### Vercel / serverless

Diski ya Vercel **haina kudumu** kwa kuandika faili: ratiba zinaweza **kupotea** baada ya deploy au kati ya invocations. Kwa production kwenye Vercel, tafadhali tumia **hifadhi ya nje** (KV, Postgres, n.k.) au host Node yenye diski (VPS). `npm run dev` na VPS zinafanya kazi na JSON ya kawaida.

### Cron ya Vercel

`vercel.json` ina cron **mara moja kwa siku** (`0 6 * * *` = saa 6:00 **UTC**) inayolenga **`/api/cron`**. Hii inalingana na mipaka ya **Vercel Hobby** (cron si zaidi ya mara moja kwa siku). Kwa mara nyingi kwa siku unahitaji **Pro** au huduma ya nje (cron-job.org) inayopiga URL yako. Weka `CRON_SECRET` kwenye Environment Variables. URL: **`https://<domain-yako>/api/cron`**.

---

## API fupi

| Njia | Kazi |
|------|------|
| `GET /api/meta` | `siteName`, `topic`, `scheduleTz`, `adminAuthOpen`, `adminRequired`, `adminSecretMissing`, `cronConfigured` |
| `POST /api/send` | Tuma sasa (`title`, `body`, `image`); ikiwa `ADMIN_SECRET` imewekwa, lazima header iendane na siri |
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
