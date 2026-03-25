import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCorsOrigins, type WorkerBindings } from "./config/runtime";
import { yoga } from "./server";

const app = new Hono<{ Bindings: WorkerBindings }>();

app.get("/", (c) => c.text("Hello World!"));

app.use("/graphql", (c, next) =>
	cors({
		origin: getCorsOrigins(c.env),
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "OPTIONS"],
	})(c, next),
);

app.all("/graphql", (c) =>
	yoga.fetch(c.req.raw, {
		env: c.env,
	}),
);

export default app;
