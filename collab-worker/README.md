# moleculeos-collab

Realtime store for teammates editing the site's text and text layout (Cloudflare Worker + one Durable Object).

- `GET /doc` – public, returns the shared draft `{ rev, overrides }`
- `GET /ws` – WebSocket; the first message must carry the edit password, after that the socket can edit and sees presence

## Local

```bash
echo 'EDIT_PASSWORD=pick-something' > collab-worker/.dev.vars
npm run collab:dev          # worker on :8787
echo 'NEXT_PUBLIC_COLLAB_URL=http://localhost:8787' > .env.local
npm run dev                 # open http://localhost:3000 (editable by default)
```

## Deploy

```bash
cd collab-worker
CLOUDFLARE_ACCOUNT_ID=ca7cd5686104492929d5fed56467e764 npx wrangler@4.151.0 secret put EDIT_PASSWORD
CLOUDFLARE_ACCOUNT_ID=ca7cd5686104492929d5fed56467e764 npx wrangler@4.151.0 deploy
```

Build the preview site with `NEXT_PUBLIC_COLLAB_URL=https://moleculeos-collab.<subdomain>.workers.dev` so it shows the live draft and is editable by default (no ?edit needed);
hide this for production: leave it unset for the production build: the site then only contains what is committed in `content/collab-overrides.json`.

## Publish the draft

`npm run collab:pull` snapshots the draft into `content/collab-overrides.json`; commit it and deploy as usual.
