# Web app

This Next.js 16 app uses Clerk for authentication.

## Environment

Create `web/.env.local` from `web/.env.example` and provide:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

The example env file also includes the sign-in/sign-up route configuration and redirects users to `/dashboard` after auth.

## Start

```bash
npm install
npm run dev
```

Visit:

- `/sign-up` to create an account
- `/sign-in` to sign in
- `/dashboard` to test the protected route
