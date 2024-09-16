import { Hono } from "hono";
import { cors } from "hono/cors";

import { logger } from "hono/logger";
import { AccountApp, StatusApp } from "./controllers/index.js";
import { engine } from "./instances/engine.js";

export const app = new Hono();
app.use(logger());
app.use("*", cors());

app.get("/", async (c) => {
  const html = engine.renderFile("index");
  return c.html(html);
});

app.route("/status", StatusApp.router);
app.route("/account", AccountApp.router);
