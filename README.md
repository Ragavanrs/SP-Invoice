# Surya Power ERP (SP-Invoice)

SP-Invoice is now a **Next.js-only** application and is directly deployable on **Vercel**.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Local development
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build and lint
```bash
npm run lint
npm run build
```

## API endpoint
A built-in Next.js API route is available:
- `GET /api/v1/health`

Example response:
```json
{
  "status": "UP",
  "service": "surya-power-next",
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

## Deploy on Vercel
This repository is ready for direct Vercel deployment:
1. Import the GitHub repository in Vercel.
2. Framework preset: **Next.js** (auto-detected).
3. Keep default build settings.
4. Deploy.
