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

  const founds = await db
    .selectFrom("daily_holding")
    .select("date_kst")
    .distinct()
    .orderBy("date_kst desc")
    .execute();
  const items = founds.map((x) => x.date_kst);

  const html = engine.renderFile("account_list", { dateKst, items });
  return c.html(html);
});

router.get("/today", async (c) => {
  const dateKst = deriveDateKst(new Date());
  const nextUrl = `/account/history/${dateKst}`;
  return c.redirect(nextUrl);
});

router.get("/history/:dateKst", async (c) => {
  const dateKst = c.req.param("dateKst");
  const data = await BalanceService.load(db, dateKst);
  const html = engine.renderFile("account_detail", { ...data, dateKst });
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
  const result = await NamuhClient.fetch_s8202({ accountIndex });
  return c.json(result);
});

// update: db 수동 갱신
router.post("/update", async (c) => {
  const now = new Date();
  const dateKst = deriveDateKst(now);

  try {
    const accounts = R.range(1, settings.ACCOUNT_COUNT + 1);
    const tasks = accounts.map(async (accountIndex) =>
      NamuhClient.fetch_s8202({ accountIndex }),
    );
    const results = await Promise.all(tasks);

    // TODO: 에러는 실제로 터지는거 보고 대응할 예정
    // 로그인 에러가 발생할지도?
    for (const result of results) {
      if (result.errors.length > 0) {
        for (const error of result.errors) {
          console.error(error);
          throw new Error("Error occurred while fetching s8202");
        }
      }
    }

    await BalanceService.save(db, results, dateKst);
    return c.json({ now, dateKst });
  } catch (e) {
    console.error(e);
    const data =
      e instanceof Error
        ? {
            name: e.name,
            message: e.message,
            stack: e.stack?.split("\n"),
          }
        : (e as object);
    return c.json(data, 500);
  }
});

// recent: db 기준으로 조회할것
router.get("/recent", async (c) => {
  const dateKst = deriveDateKst(new Date());
  const data = await BalanceService.load(db, dateKst);
  return c.json(data);
});
