# Setup and deploy, in order

## 1. Install tools (once)
- Node 24 or newer: install nvm, then `nvm install 24 && nvm use 24`. Check with `node -v`.
- Git: `git --version`. Optional: GitHub CLI (`gh`).
- A code editor such as VS Code.

## 2. GitHub
1. Create a GitHub account if needed.
2. Create a new **private** repository named `katbox-site` (no README, no .gitignore, the project already has them).
3. In this project folder:
   ```
   git remote add origin https://github.com/<your-username>/katbox-site.git
   git branch -M main
   git push -u origin main
   ```

## 3. Run it locally
```
npm install
cp .env.example .env
npm run dev
```
Open http://localhost:44100. Without `MONGODB_URI` the contact form still works but only logs messages to the terminal.
```
npm test
npm run typecheck
```

## 4. MongoDB Atlas
1. Create an account at mongodb.com/atlas and create a free (M0) cluster.
2. Database Access: add a database user with a strong password (save it).
3. Network Access: Railway does not give you a fixed IP on standard plans, so allow `0.0.0.0/0`. The database user's password is then your protection, so make it long and never commit it.
4. Connect, Drivers: copy the connection string (`mongodb+srv://...`) and replace `<password>` with the real one.
5. Put it in `.env`:
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=katbox
   ```
   If the password has special characters (`@ : / ?`), URL-encode them.
6. Run `npm run dev`, send a message through the form, and look in Atlas, Browse Collections, `katbox.messages`. Also open http://localhost:44100/health and expect `{"ok":true,"db":true}`.

## 5. Push everything to GitHub
```
git add -A
git commit -m "Describe your change"
git push
```
`.env` is git-ignored. Never commit it.

## 6. Railway
1. Create an account at railway.com and sign in with GitHub.
2. New Project, Deploy from GitHub repo, pick `katbox-site`. (Check Railway's current pricing and trial limits.)
3. Open the service, Variables tab, add:

   | Name | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas connection string |
   | `MONGODB_DB` | `katbox` |
   | `TRUST_PROXY` | `1` |
   | `BLADES_OF_CHANCE_URL` | your Roblox game link (optional) |
   | `SITE_ORIGIN` | add after step 8 |

4. Settings: start command `npm start` (usually detected). Healthcheck path `/health`.
5. Deploy. The app needs no build step. If the deploy logs show a Node version below 24, check that Railway picked up `.node-version` / `engines`, or set the Node version in its settings.
6. Settings, Networking, Generate Domain. Open it and confirm the site loads and `/health` returns ok.

## 7. Cloudflare and your domain
1. Create a Cloudflare account. katbox.org is not registered to you yet, so search for it under Domain Registration and buy it if it is available (do not assume it is). If you buy it elsewhere, add it to Cloudflare and change its nameservers to Cloudflare's.
2. In Railway, Settings, Networking, Custom Domain: add `katbox.org`. Railway shows a CNAME target (and sometimes a TXT verification record).
3. In Cloudflare, DNS: add the records Railway shows. For the root domain use a CNAME on `@` (Cloudflare flattens it). Add a `www` CNAME too.
4. Start with the proxy set to **DNS only** (grey cloud). Wait until Railway shows the domain as verified with a certificate.
5. Then you can switch the proxy on (orange cloud) and set Cloudflare SSL/TLS mode to **Full (strict)**.
6. Pick one canonical address (for example `https://katbox.org`) and add a Cloudflare redirect rule from `www` to it.

## 8. Finish
1. In Railway set `SITE_ORIGIN=https://katbox.org` (exactly what shows in the browser, no trailing slash). The contact form rejects posts from any other origin, so a mismatch gives a 403.
2. Redeploy.

## 9. Final production test
- `https://katbox.org` loads over HTTPS, on phone and desktop.
- `https://katbox.org/health` returns `{"ok":true,"db":true}`.
- Submit the contact form with real details: you see the thank-you message and the message appears in Atlas, `katbox.messages`.
- Submit it with a bad email: you see the error text.
- `www` redirects to the main address.
- Favicon works, and the Blades of Chance button appears once `BLADES_OF_CHANCE_URL` is set.
- Push a small change to GitHub and confirm Railway redeploys it.

## Not done yet (worth adding later)
- No email notification when a message arrives. Messages sit in Atlas only.
- No rate limiting beyond a hidden spam field. Cloudflare Turnstile is a good next step if spam shows up.
- The Blades of Chance link and real game screenshots are placeholders.
