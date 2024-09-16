import { Hono } from "hono";
import * as R from "remeda";
import { z } from "zod";
import { engine } from "../instances/engine.js";
import { NamuhClient } from "../services/index.js";
import { settings } from "../settings/index.js";

export const router = new Hono();

router.get("/index", async (c) => {
  const html = engine.renderFile("account_index");
  return c.html(html);
});

router.get("/query/s8202/:accountIndex", async (c) => {
  const schema = z.object({
    accountIndex: z.coerce.number().positive(),
  });
  const data = schema.parse({
    ...c.req.param(),
  });
  const { accountIndex } = data;
  const result = await NamuhClient.fetch_s8202(accountIndex);
  return c.json(result);
});

router.get("/current", async (c) => {
  // TODO: fetch current data
  const accounts = R.range(1, settings.ACCOUNT_COUNT + 1);
  const tasks = accounts.map(async (accountIndex) =>
    NamuhClient.fetch_s8202(accountIndex),
  );
  const results = await Promise.all(tasks);
  return c.json(results);
});
