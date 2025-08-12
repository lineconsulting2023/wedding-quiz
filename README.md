# Wedding Quiz (Static, Ably)

This is a minimal **static** web app (no build) with three pages:

- `/join` — participant (smartphone)
- `/host` — host control (your PC)
- `/screen` — big screen view (projector)

It uses **Ably** for realtime. You'll only edit `config.js` to set your **ABLY_KEY** and default **ROOM** name.

## Quick start

1. Open `config.js` and paste your Ably **Public API Key**.
2. Commit & push to GitHub (public OK for now).
3. On Vercel, **Import** this repo. Add an Environment Variable if you like (`ABLY_KEY`) but this static version uses `config.js`.
4. Open the deployed URLs:
   - `https://<your-app>.vercel.app/host`
   - `https://<your-app>.vercel.app/join`
   - `https://<your-app>.vercel.app/screen`

## Notes

- Scoring: Correct = 1 point. Ties are broken by **faster answer**.
- Up to ~100 participants should work fine for a wedding-scale event.
- This is a simple demo — no login. For private events, change the ROOM name in `config.js` and don't share it widely.

