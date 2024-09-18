import type { MyKysely } from "../tables/index.js";
import { ProductTable as Table } from "../tables/tables.js";

export const upsert = async (db: MyKysely, products: Table.NewRow[]) => {
  const result = await db
    .insertInto(Table.name)
    .values(products)
    .onConflict((oc) => oc.column("issue_codez12").doNothing())
    .executeTakeFirst();
  return result;
};

export const findByIds = async (
  db: MyKysely,
  ids: string[],
): Promise<Table.Row[]> => {
  if (ids.length <= 0) {
    return [];
  }

  return await db
    .selectFrom(Table.name)
    .selectAll()
    .where("issue_codez12", "in", ids)
    .execute();
};
