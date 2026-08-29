# Choice Hold'em — self-hosted server

Real-time two-player version of the game, running on your own server via Render (or any Node host).

## Local test
```
npm install
npm start
```
Then open http://localhost:3000 in two browser tabs (or two phones on the same wifi, using your computer's local IP instead of localhost).

## Deploy to Render (free, no credit card)
1. Push this whole folder to a new GitHub repository (create a free GitHub account first if needed).
2. Go to https://render.com → sign up (no card required) → "New +" → "Web Service".
3. Connect your GitHub repo.
4. Render should auto-detect Node.js. If asked:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Click "Create Web Service". First deploy takes a couple of minutes.
6. You'll get a URL like `https://choice-holdem-xxxx.onrender.com` — that's it, HTTPS included automatically.

## Known trade-off on the free tier
The service goes to sleep after 15 minutes with no traffic, and the next visitor triggers a
30-50 second cold start while it wakes up. Fine for casual playtesting — just give testers a
heads up that the very first load might be slow.

## What's NOT hardened yet (fine for a friendly playtest, not for a public release)
- Room state lives in server memory only — a server restart clears all active rooms.
- No move validation server-side — a malicious client could send a bogus state. Trusted-friend
  testing only until this gets addressed.
- No protection against two people claiming the same open seat at the exact same instant.
