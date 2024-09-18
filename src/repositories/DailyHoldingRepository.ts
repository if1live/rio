import { type MyKysely, DailyHoldingTable as Table } from "../tables/index.js";

export const upsert = async (db: MyKysely, rows: Table.NewRow[]) => {
  if (rows.length === 0) {
    return;
  }

  const result = await db
    .insertInto(Table.name)
    .values(rows)
    .onConflict((oc) =>
      oc.columns(["account_id", "issue_codez12", "date"]).doNothing(),
    )
    .executeTakeFirst();
  return result;
};

export const findByDate = async (
  db: MyKysely,
  date: string,
): Promise<Table.Row[]> => {
  return await db
    .selectFrom(Table.name)
    .selectAll()
    .where("date", "=", date)
    .execute();
};
