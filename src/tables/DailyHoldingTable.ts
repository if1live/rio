import type { Insertable, Selectable } from "kysely";
import type { KyselifyEntity } from "kysely-typeorm";
import type { DailyHoldingEntity } from "../../entities/DailyHoldingEntity.js";

export const name = "daily_holding";
export type Table = KyselifyEntity<DailyHoldingEntity>;

export type Row = Selectable<Table>;
export type NewRow = Insertable<Table>;

export const primaryKey = ["date_kst", "account_id", "issue_code"] as const;
export type PrimaryKey = Pick<Table, (typeof primaryKey)[number]>;
