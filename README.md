# pinequest-s3-e2-team-5

## Web auth setup

The `web/` Next.js app is now wired to Clerk with:

- a shared `ClerkProvider` in the app layout
- custom `/sign-in` and `/sign-up` routes
- a protected `/dashboard` route through `web/proxy.ts`

## Run locally

1. Create a Clerk application in the Clerk dashboard.
2. Copy `web/.env.example` to `web/.env.local`.
3. Fill in `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
4. Start the web app:

```bash
cd web
npm install
npm run dev
```

After signing in or signing up, users are redirected to `/dashboard`.
