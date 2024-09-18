import fs from "node:fs/promises";
import { Hono } from "hono";
import * as R from "remeda";
import { z } from "zod";
import { deriveDateKst } from "../helpers/index.js";
import { db } from "../instances/db.js";
import { engine } from "../instances/engine.js";
import type { S8202Response } from "../models/s8202.js";
import { BalanceService, NamuhClient } from "../services/index.js";
import { settings } from "../settings/index.js";

export const router = new Hono();

router.get("/index", async (c) => {
  const dateKst = deriveDateKst(new Date());

  const data = await BalanceService.load(db, dateKst);
  const html = engine.renderFile("account_index", { ...data, dateKst });
  return c.html(html);
});

// current: 직접 요청해서 현재 상태 얻기
router.get("/current/s8202/:accountIndex", async (c) => {
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

// refresh: db 수동 갱신
router.get("/refresh", async (c) => {
  const accounts = R.range(1, settings.ACCOUNT_COUNT + 1);
  const tasks = accounts.map(async (accountIndex) =>
    NamuhClient.fetch_s8202(accountIndex),
  );
  const results = await Promise.all(tasks);

  const dateKst = deriveDateKst(new Date());
  await BalanceService.save(db, results, dateKst);
  return c.json(results);
});

// recent: db 기준으로 조회할것
router.get("/recent", async (c) => {
  const dateKst = deriveDateKst(new Date());
  const data = await BalanceService.load(db, dateKst);
  return c.json(data);
});

router.get("/update", async (c) => {
  const fp = "D:/finance/rio/mocks/current.json";
  const text = await fs.readFile(fp, "utf-8");
  const data = JSON.parse(text) as S8202Response[];

  const dateKst = deriveDateKst(new Date());
  await BalanceService.save(db, data, dateKst);
  return c.json({ ok: true });
});
