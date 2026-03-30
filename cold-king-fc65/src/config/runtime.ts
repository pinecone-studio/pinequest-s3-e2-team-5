const defaultCorsOrigins = ["http://localhost:3000", "http://127.0.0.1:3000", "https://pinequest-s3-e2-team-5-web.ebmsteam10.workers.dev"];

export type WorkerBindings = Env & {
	CLERK_SECRET_KEY?: string;
	CLERK_PUBLISHABLE_KEY?: string;
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
	CLERK_JWT_KEY?: string;
	CLERK_AUTHORIZED_PARTIES?: string;
	CORS_ORIGINS?: string;
	exam_media?: R2Bucket;
};

export function getPublishableKey(env: WorkerBindings) {
	return env.CLERK_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

export function getAuthorizedParties(env: WorkerBindings) {
	if (!env.CLERK_AUTHORIZED_PARTIES) {
		return undefined;
	}

	return env.CLERK_AUTHORIZED_PARTIES
		.split(",")
		.map((party) => party.trim())
		.filter(Boolean);
}

export function getCorsOrigins(env: Pick<WorkerBindings, "CORS_ORIGINS">) {
	if (!env.CORS_ORIGINS) {
		return defaultCorsOrigins;
	}

	return env.CORS_ORIGINS.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}
