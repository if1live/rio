import type { Insertable, Selectable } from "kysely";
import type { KyselifyEntity } from "kysely-typeorm";
import type { ProductEntity } from "../../entities/ProductEntity.js";

export const name = "product";
export type Table = KyselifyEntity<ProductEntity>;

export type Row = Selectable<Table>;
export type NewRow = Insertable<Table>;

export const primaryKey = ["issue_code"] as const;
export type PrimaryKey = Pick<Table, (typeof primaryKey)[number]>;
