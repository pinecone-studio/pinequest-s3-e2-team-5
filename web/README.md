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

## Deployment

CD is configured through GitHub Actions in [.github/workflows/cd.yml](../.github/workflows/cd.yml) and deploys the app to Cloudflare Workers with `vinext` and `wrangler`.

- Pull requests that change `web/**` deploy a preview worker environment.
- Pushes to `main` that change `web/**` deploy production.

Required GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Required Cloudflare runtime environment variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`

Set these variables in the Cloudflare dashboard for:

- the default production environment on `pinequest-s3-e2-team-5-web`
- the `preview` environment if you want pull request preview deploys to boot correctly

Notes:

- The deploy command uses `wrangler deploy --keep-vars`, so dashboard-managed Cloudflare variables are preserved during deploys.
- Because this repo contains both `web/` and `service/`, the workflow runs from `web/` explicitly.

To obtain the Cloudflare GitHub secrets:

1. Create a Cloudflare API token with permission to deploy Workers.
2. Copy your Cloudflare account ID from the dashboard.
3. Add both values to GitHub repository secrets.

Local helper commands:

- `npx vinext build` builds the app for the Workers runtime.
- `npm run preview` runs the Worker locally with `wrangler dev`.
- `npm run deploy` deploys production using the current Cloudflare credentials.
