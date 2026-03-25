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
		accountId: readEnv('630398f7cca5a714a459a22c46cd6b52'),
		databaseId: readEnv('0e9746f0-2a0d-4080-b934-fe4a08e99971'),
		token: readEnv('cfut_X2f6NDo5DLz0H6MYu2eZrourU06IdDwB7msmSqkhe0d138de'),
	},
});
