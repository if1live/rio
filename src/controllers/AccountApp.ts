import { Hono } from "hono";
import * as R from "remeda";
import { z } from "zod";
import { deriveDateKst } from "../helpers/index.js";
import { db } from "../instances/db.js";
import { engine } from "../instances/engine.js";
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

// update: db 수동 갱신
router.post("/update", async (c) => {
  const accounts = R.range(1, settings.ACCOUNT_COUNT + 1);
  const tasks = accounts.map(async (accountIndex) =>
    NamuhClient.fetch_s8202(accountIndex),
  );
  const results = await Promise.all(tasks);

  const now = new Date();
  const dateKst = deriveDateKst(now);
  await BalanceService.save(db, results, dateKst);
  return c.json({ now, dateKst });
});

// recent: db 기준으로 조회할것
router.get("/recent", async (c) => {
  const dateKst = deriveDateKst(new Date());
  const data = await BalanceService.load(db, dateKst);
  return c.json(data);
});
