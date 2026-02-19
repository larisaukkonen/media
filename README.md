# media-admin

Next.js (App Router) + Neon (Postgres) starter for a media admin + monitor playback API.

## Local Development

### 1) Install
```bash
npm install
```

### 2) Configure env
Copy `.env.example` to `.env.local` and set:
- `DATABASE_URL`
- `STORAGE_BUCKET_URL` (placeholder for now)

### 3) Create tables in Neon
Run `db/schema.sql` in Neon SQL editor.

### 4) Dev
```bash
npm run dev
```

## Vercel Deployment Requirements

### Required services
- Vercel project connected to this repository
- Neon Postgres database
- Object storage for media uploads (Vercel Blob or S3-compatible bucket)

### Required environment variables (Vercel Project -> Settings -> Environment Variables)
- `DATABASE_URL`: Neon Postgres connection string
- `STORAGE_BUCKET_URL`: Base URL of your media bucket

Set these for at least:
- `Production`
- `Preview`
- `Development` (optional, for Vercel dev workflows)

### Build/runtime expectations
- Framework preset: `Next.js` (auto-detected by Vercel)
- Install command: `npm install`
- Build command: `npm run build`
- Output: `.next`
- Node runtime: use Vercel default for Next.js 14 (Node 18+)

## Deploy Checklist (Vercel)

1. Import repo to Vercel.
2. Add required env vars (`DATABASE_URL`, `STORAGE_BUCKET_URL`).
3. Run `db/schema.sql` against your Neon production database.
4. Deploy.
5. Verify API routes, for example:
   - `GET /api/monitor/<deviceToken>`
   - `POST /api/admin/media`

## Important Notes Before Production

- `app/api/admin/media/upload-url/route.ts` is currently a placeholder and does not generate real signed upload URLs yet.
- CORS for `/api/*` is currently `*` in `next.config.js`; tighten this if you need restricted origins.
- API routes live under `app/api/...`.
