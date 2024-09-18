import type { Kysely } from "kysely";
import { DailyHoldingTable, type ProductTable } from "./tables.js";

export * from "./tables.js";

export interface MyDatabase {
  [ProductTable.name]: ProductTable.Table;
  [DailyHoldingTable.name]: DailyHoldingTable.Table;
}

export type MyKysely = Kysely<MyDatabase>;
