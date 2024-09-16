import { Hono } from "hono";
import { AccountApp, StatusApp } from "./controllers/index.js";

export const app = new Hono();

app.get("/hello", async (c) => {
  return c.json({ ok: true });
});

app.route("/status", StatusApp.router);
app.route("/account", AccountApp.router);
