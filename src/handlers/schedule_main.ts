import type { ScheduledHandler } from "aws-lambda";
import * as R from "remeda";
import { deriveDateKst } from "../helpers/index.js";
import { db } from "../instances/index.js";
import { BalanceService, NamuhClient } from "../services/index.js";
import { settings } from "../settings/index.js";

export const handler: ScheduledHandler = async (event) => {
  const accounts = R.range(1, settings.ACCOUNT_COUNT + 1);
  const tasks = accounts.map(async (accountIndex) =>
    NamuhClient.fetch_s8202(accountIndex),
  );
  const results = await Promise.all(tasks);

  const dateKst = deriveDateKst(new Date());
  await BalanceService.save(db, results, dateKst);

  console.log(results);
};
