import fs from "node:fs/promises";
import { Hono } from "hono";
import * as R from "remeda";
import { z } from "zod";
import { db } from "../instances/db.js";
import { engine } from "../instances/engine.js";
import { AccountSummary } from "../models/index.js";
import type { S8202Response } from "../models/s8202.js";
import { BalanceService, NamuhClient } from "../services/index.js";
import { settings } from "../settings/index.js";

export const router = new Hono();

// TODO: 로컬 시간대로 쓰는게 유용할듯
// TODO: 날짜별 기록은 나중에 하드코딩
const today = "1970-01-01";

router.get("/index", async (c) => {
  const reports = await BalanceService.load(db, today);
  const summary = AccountSummary.create({
    lsnpf_amt_wonz18: R.sumBy(reports, (x) => x.summary.lsnpf_amt_wonz18),
    ass_amtz18: R.sumBy(reports, (x) => x.summary.ass_amtz18),
    byn_amtz18: R.sumBy(reports, (x) => x.summary.byn_amtz18),
  });
  const html = engine.renderFile("account_index", { reports, summary });
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
router.get("/refresh/s8202/:accountIndex", async (c) => {
  // TODO: qvopenapi -> db
  // TODO: 시간대 주의
  return c.json({ message: "refreshing" });
});

// recent: db 기준으로 조회할것
router.get("/recent", async (c) => {
  // TODO: fetch current data
  const accounts = R.range(1, settings.ACCOUNT_COUNT + 1);
  const tasks = accounts.map(async (accountIndex) =>
    NamuhClient.fetch_s8202(accountIndex),
  );
  const results = await Promise.all(tasks);
  return c.json(results);
});

router.get("/update", async (c) => {
  const fp = "D:/finance/rio/mocks/current.json";
  const text = await fs.readFile(fp, "utf-8");
  const data = JSON.parse(text) as S8202Response[];
  await BalanceService.save(db, data, today);
  return c.json({ ok: true });
});
