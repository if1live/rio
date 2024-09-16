import { Hono } from "hono";
import * as R from "remeda";
import type { S8202Request, S8202Response } from "./models/s8202.js";
import { settings } from "./settings/index.js";

export const app = new Hono();

app.get("/hello", async (c) => {
  return c.json({ ok: true });
});

app.get("/current", async (c) => {
  // TODO: fetch current data
  const accounts = R.range(1, settings.ACCOUNT_COUNT + 1);
  const tasks = accounts.map(async (accountIndex) => fetch_s8202(accountIndex));
  const results = await Promise.all(tasks);
  return c.json(results);
});

const fetch_s8202 = async (accountIndex: number) => {
  const base = settings.QVOPENAPI_ENDPOINT;
  const path = "/query/s8202";
  const endpoint = `${base}${path}`;

  const req: S8202Request = {
    account_index: accountIndex,
  };
  const body = JSON.stringify(req);

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
  const json = await resp.json();
  return json as S8202Response;
};
