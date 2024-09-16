import { Hono } from "hono";

export const router = new Hono();

router.get("/release", async (c) => {
  return c.json({ status: "ok" });
});
