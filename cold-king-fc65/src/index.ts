import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCorsOrigins, type WorkerBindings } from "./config/runtime";
import { getRequestAuth, yoga } from "./server";

const app = new Hono<{ Bindings: WorkerBindings }>();

function sanitizePathSegment(value: string) {
	return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

app.get("/", (c) => c.text("Hello World!"));

app.use("/graphql", (c, next) =>
	cors({
		origin: getCorsOrigins(c.env),
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "OPTIONS"],
		credentials: true
	})(c, next),
);

app.use("/uploads/*", (c, next) =>
	cors({
		origin: getCorsOrigins(c.env),
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "OPTIONS"],
		credentials: true,
	})(c, next),
);

app.all("/graphql", (c) =>
	yoga.fetch(c.req.raw, {
		env: c.env,
	}),
);

app.post("/uploads/question-image", async (c) => {
	if (!c.env.exam_media) {
		return c.json({ error: "Question media bucket is not configured." }, 500);
	}

	const auth = await getRequestAuth(c.req.raw, c.env);
	if (!auth.isAuthenticated || !auth.userId) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const formData = await c.req.raw.formData();
	const file = formData.get("file");
	const examId = String(formData.get("examId") ?? "").trim();
	const questionId = String(formData.get("questionId") ?? "draft").trim();
	const choiceId = String(formData.get("choiceId") ?? "").trim();

	if (!(file instanceof File)) {
		return c.json({ error: "No file uploaded." }, 400);
	}

	if (!file.type.startsWith("image/")) {
		return c.json({ error: "Only image uploads are supported." }, 400);
	}

	if (!examId) {
		return c.json({ error: "examId is required." }, 400);
	}

	const safeFileName = sanitizePathSegment(file.name || "image");
	const keyParts = [
		"question-media",
		sanitizePathSegment(auth.userId),
		sanitizePathSegment(examId),
		sanitizePathSegment(questionId),
	];

	if (choiceId) {
		keyParts.push(sanitizePathSegment(choiceId));
	}

	keyParts.push(`${Date.now()}-${safeFileName}`);
	const key = keyParts.join("/");

	await c.env.exam_media.put(key, file.stream(), {
		httpMetadata: {
			contentType: file.type,
			contentDisposition: "inline",
		},
		customMetadata: {
			uploadedBy: auth.userId,
			examId,
			questionId,
			choiceId,
		},
	});

	const url = new URL(c.req.url);
	url.pathname = `/media/${key}`;
	url.search = "";

	return c.json({
		key,
		url: url.toString(),
	});
});

app.get("/media/*", async (c) => {
	if (!c.env.exam_media) {
		return c.text("Question media bucket is not configured.", 500);
	}

	const key = decodeURIComponent(c.req.path.replace(/^\/media\//, ""));
	if (!key) {
		return c.text("Missing media key.", 400);
	}

	const object = await c.env.exam_media.get(key);
	if (!object) {
		return c.text("Not found.", 404);
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set("etag", object.httpEtag);
	headers.set("cache-control", headers.get("cache-control") ?? "public, max-age=31536000, immutable");

	return new Response(object.body, {
		headers,
	});
});

export default app;
