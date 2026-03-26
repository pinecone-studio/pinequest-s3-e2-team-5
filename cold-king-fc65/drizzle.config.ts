import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

function readEnv(name: string) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required env var: ${name}`);
	}

	return value;
}

export default defineConfig({
	schema: './src/db/schemas/*',
	out: './drizzle/migrations',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		accountId: readEnv('CLOUDFLARE_ACCOUNT_ID'),
		databaseId: readEnv('CLOUDFLARE_D1_DATABASE_ID'),
		token: readEnv('CLOUDFLARE_D1_TOKEN'),
	},
});
