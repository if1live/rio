import { assert } from "@toss/assert";
import * as R from "remeda";
import { type MyKysely, DailyHoldingTable as Table } from "../tables/index.js";

// date + account 단위만 upsert를 허용
// 데이터 입력 패턴이 복잡해지면 지우고 추가하는 방식을 쓸 수 없다.
// 진짜 upsert를 쓰면 비표준 규격이라서 pg, sqlite에서 동시에 돌게 하려고 삽질 해야됨
const assertUpsertable = (rows: Table.NewRow[]) => {
  const candidates_dateKst = R.pipe(
    rows,
    R.map((row) => row.date_kst),
    R.unique(),
  );
  const candidates_accountId = R.pipe(
    rows,
    R.map((row) => row.account_id),
    R.unique(),
  );

  // 없는건 허용. 빈배열로 떄우면 되니까
  assert(candidates_dateKst.length <= 1, "date_kst must be unique");
  assert(candidates_accountId.length <= 1, "account_id must be unique");
};

export const upsert = async (db: MyKysely, rows: Table.NewRow[]) => {
  assertUpsertable(rows);

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
