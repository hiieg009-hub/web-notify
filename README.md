# web-notify

Tovuti ndogo ya kutuma arifa kupitia **Firebase Cloud Messaging (HTTP v1)** — inalingana na ule muundo wa `data` (`title`, `body`, `image`) ulio kwenye app ya Android ya Betmakini.

**GitHub:** [https://github.com/basanzietech/web-notify](https://github.com/basanzietech/web-notify)

---

## Usalama na repo ya kibinafsi

- Weka repo **Private** kwenye GitHub ili mtu asiye na ruhusa asiweze kuona code wala issues.
- **Usiwahi** ku-commit: `service-account.json`, `.env`, `.env.local`, funguo za PEM, au `google-services.json`. Faili hizi ziko kwenye `.gitignore`.
- Siri za production (JSON ya service account) ziweke tu kwenye **Environment Variables** ya Vercel (au host yako), si ndani ya faili zinazosawiriwa Git.
- **Topic** ya FCM ni **thabiti upande wa server**: thamani ni `FCM_TOPIC` (chaguo-msingi `BETMAKINI`). Hata mtu akijaribu kutuma `topic` tofauti kwenye API, server haitumii — hivyo data yako ya ujumbe haiendi topic isiyoidhinishwa.

---

## Mahitaji

- Node.js 18+ (kwa `fetch` ndani ya server)
- Akaunti ya Firebase na **Service Account** yenye ruhusa za kutumia FCM v1

---

## Local (PC yako)

```bash
cd web-notify
npm install
cp .env.example .env.local
# Hariri .env.local: weka GOOGLE_APPLICATION_CREDENTIALS au FIREBASE_SERVICE_ACCOUNT_JSON
npm run dev
```

Fungua: `http://localhost:3000`

---

## Deploy (Vercel)

1. Import repo kutoka [GitHub](https://github.com/basanzietech/web-notify).
2. Kwenye **Settings → Environment Variables** weka:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — mstari mmoja wa JSON kamili ya service account **au**
   - `GOOGLE_APPLICATION_CREDENTIALS` haifanyi kazi vizuri Vercel bila faili; bora JSON kwenye variable hiyo.
3. (Chaguo) `FCM_TOPIC=BETMAKINI` ikiwa unataka kubadilisha baadaye bila kubadilisha code.

---

## Scheduli (cron) — je, inawezekana?

**Ndiyo.** Hii project kwa sasa inatumia tu “tuma sasa” kutoka fomu. Ili **ratiba** (kila siku, kila saa, n.k.) unaweza:

| Njia | Maelezo mafupi |
|------|----------------|
| **Vercel Cron** | Ongeza `vercel.json` na route ya cron inayopiga endpoint yako (kwa usalama tumia siri ya header kama `CRON_SECRET`). |
| **GitHub Actions** | Workflow yenye `schedule:` inayoituma `curl` POST kwenye URL yako ya production pamoja na token/siri. |
| **Google Cloud Scheduler** | Inaweza kumshika **Cloud Function** au URL ya nje inayoituma ombi la kutuma FCM. |
| **Huduma za nje** | Mfano cron-job.org / EasyCron zinazopiga API yako kwa muda ulioweka. |

Ili scheduli iwe salama, usifunue endpoint bila **uhakiki** (mfano header siri au Vercel cron verification). Ukitaka, tunaweza baadaye kuongeza `api/cron.js` maalum yenye `CRON_SECRET`.

---

## Muundo wa mradi

| Njia | Faili |
|------|--------|
| UI | `public/index.html` |
| API (Vercel) | `api/send.js`, `api/meta.js` (onyesha topic thabiti) |
| Logic ya FCM | `lib/fcmSend.js` |
| Local server | `server-local.js` |

---

## Leseni

Code ya mradi wako; tumia kulingana na sera yako ya ndani / ya kampuni.
