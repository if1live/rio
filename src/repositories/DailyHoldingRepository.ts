import { type MyKysely, DailyHoldingTable as Table } from "../tables/index.js";

export const upsert = async (db: MyKysely, rows: Table.NewRow[]) => {
  return await db.transaction().execute(async (trx) => {
    return upsert_naive(trx, rows);
  });
};

const upsert_naive = async (db: MyKysely, rows: Table.NewRow[]) => {
  const first = rows[0];
  if (!first) {
    return;
  }

  // upsert로 싸우기 싫어서 기존 항목 지우고 추가
  // 어차피 날짜 단위로 통째로 갱신이니까 큰 문제 없을듯?
  const dateKst = first.date_kst;
  await db
    .deleteFrom(Table.name)
    .where("date_kst", "=", dateKst)
    .where("account_id", "=", first.account_id)
    .execute();

  const result = await db
    .insertInto(Table.name)
    .values(rows)
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
    .where("date_kst", "=", date)
    .execute();
};
