import { Hono } from "hono";
import { db } from "../instances/index.js";
import { sql } from "kysely";

export const router = new Hono();

router.get("/release", async (c) => {
  return c.json({ status: "ok" });
});

router.get("/external", async (c) => {
  const fn_db = async () => {
    type Row = { v: number };
    const compiledQuery = sql<Row>`SELECT 1+2 AS v`.compile(db);
    const output = await db.executeQuery(compiledQuery);
    const row = output.rows[0];
    return row;
  };

  const [result_db] = await Promise.allSettled([fn_db()]);
  return c.json({
    db: result_db,
  });
});
