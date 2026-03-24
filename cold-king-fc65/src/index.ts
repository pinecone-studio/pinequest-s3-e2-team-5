import { Hono } from "hono";
import { yoga } from "./server";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.text("Hello World!"));

app.get("/greet", (c) => c.text("hello hono"));

app.all("/graphql", (c) =>
  yoga.fetch(c.req.raw, {
    env: c.env,
  }),
);

export default app;
