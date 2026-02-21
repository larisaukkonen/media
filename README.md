# media-admin

Next.js (App Router) media admin + monitor playback API using Vercel Blob for storage and a JSON state file.

## Local Development

### 1) Install
```bash
npm install
```

### 2) Configure env
Copy `.env.example` to `.env.local` and set:
- `BLOB_READ_WRITE_TOKEN`

### 3) Dev
```bash
npm run dev
```

## Vercel Deployment Requirements

### Required services
- Vercel project connected to this repository
- Vercel Blob store (Hobby plan is fine)

### Required environment variables (Vercel Project -> Settings -> Environment Variables)
- `BLOB_READ_WRITE_TOKEN`

Set these for at least:
- `Production`
- `Preview`

### Build/runtime expectations
- Framework preset: `Next.js`
- Install command: `npm install`
- Build command: `npm run build`
- Output: `.next`

## Deploy Checklist (Vercel)

1. Import repo to Vercel.
2. Create a Blob store and add `BLOB_READ_WRITE_TOKEN`.
3. Deploy.
4. Verify API routes, for example:
   - `GET /api/monitor/<deviceToken>`
   - `POST /api/admin/media/upload`

## Notes

- This setup stores app state in a JSON blob under Vercel Blob. There is no relational database.
- A default user is auto-created with email `lari.saukkonen@gmail.com`.
- API routes live under `app/api/...`.
