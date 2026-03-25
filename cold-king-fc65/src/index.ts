import { Hono } from "hono";
import { yoga } from "./server";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Env }>();


app.get("/", (c) => c.text("Hello World!"));

app.use("/graphql", cors({
  origin: ["http://localhost:3000"],
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "OPTIONS"]
}))

app.all("/graphql", (c) =>

  yoga.fetch(c.req.raw, {
    env: c.env,

  })

);

export default app;