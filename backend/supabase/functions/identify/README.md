# identify: photo to product guess (Gemini)

What it does: the app's "Search by photo" first tries to read a barcode on the phone. Only when there is no readable barcode does it send a small copy of the photo (about 1,000 px JPEG) here. The function asks Google's Gemini what the product is and returns `{ ok, guess: { found, brand, name, model, category, confidence } }`. The app matches that against the catalogue and shows the matches (or "we don't have it yet" with a search link).

Files: `core.mjs` (all the logic, tested by `backend/tests/identify.test.js` with a fake Gemini), `index.ts` (connects it to Supabase). `[functions.identify]` in `backend/supabase/config.toml` sets `verify_jwt = false`: the function checks the public key header itself, so the browser's preflight request works.

## Secrets (Supabase project, never the repo)
| Name | Needed | Meaning |
|---|---|---|
| `GEMINI_API_KEY` | yes | Google AI Studio key. Set under Project Settings, Edge Functions, Secrets (the exact name matters) |
| `GEMINI_MODEL` | no | Model to try first. Default: `gemini-2.5-flash-lite`, then `gemini-3.1-flash-lite`, then `gemini-flash-lite-latest` (the `-latest` aliases pointed at newer, slower models). If none of those exist for the key, the function asks Google which models the key may use and tries up to three Flash models from that list (lite first). Set this secret if you want a specific model |
| `IDENTIFY_DAILY_CAP` | no | Photos per day for everyone, default 1000 |
| `IDENTIFY_SALT` | no | Any random text; mixed into the visitor hash used for the per-visitor limit |

`SUPABASE_ANON_KEY` is provided by Supabase itself.

## Deploy
From the `backend/` folder (needs a one-time `npx supabase login`):
```bash
npx supabase functions deploy identify --project-ref hmanlftkhvruqgvkencn --no-verify-jwt
```
Or in the dashboard: Edge Functions, Deploy a new function, name `identify`, add `index.ts` and `core.mjs`, and turn off "Verify JWT".

## Check it works
Send any small JPEG (replace the key with the public key from `assets/config.js`):
```bash
curl -s -X POST https://hmanlftkhvruqgvkencn.supabase.co/functions/v1/identify \
  -H "apikey: <publishable key>" -H "Content-Type: application/json" \
  -d "{\"mime\":\"image/jpeg\",\"image\":\"$(base64 -w0 photo.jpg)\"}"
```
Expected: `{"ok":true,"guess":{...}}`. Other answers: `401` (key header missing or wrong), `503 not_configured` (secret `GEMINI_API_KEY` not found), `502 key` (Google rejected the key), `429 busy` (limit reached, wait a minute), `502 upstream` (Google error). For `502 model` and `502 key` the reply also has a `detail` field with Google's own message (cut short, no key in it), for example "models/x is not found".

## Speed and choosing a model
The function asks for no extra "thinking" (much faster: about 2 to 4 seconds instead of 10 to 18) and the app sends a 768 px picture. The success reply names the model that answered (`model`). To see which Flash models your key can use, open `GET /functions/v1/identify?diag=models` with the `apikey` header: it lists them (names only), lite models first. To force a model, set the secret `GEMINI_MODEL` (for example a "flash-lite" name from that list); no redeploy is needed.

## Limits and cost
Free tier: Google allows only a few requests a minute (about 15, check AI Studio for your key) and a daily quota. The function also limits itself: 6 photos per minute and 40 per day per visitor, 12 per minute and 1,000 per day overall (in memory per running instance, so a brake rather than a guarantee). When Gemini says it is busy the app shows "busy, try again in a minute".

## Privacy (tell the legal adviser)
The photo is sent to Google's Gemini API and is not stored or logged by DOABNO. On the free tier Google may use submitted content to improve its products; the paid tier does not. The app shows a one-line notice in the photo search sheet. Add a sentence to the privacy policy before launch, and consider switching the key to a paid project (about $0.001 or less per photo) so photos are not used for training.
