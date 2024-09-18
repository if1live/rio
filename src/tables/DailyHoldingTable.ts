import type { Insertable, Kysely, Selectable } from "kysely";
import type { SnakeCase } from "type-fest";

/*
flaot 정밀도 이슈를 피하려고 서버에서 받은걸 그대로 받아서 대응

amtz18은 100으로 나눠야할수도? QVOpenApi 기준으로 amtz16가 일반적
현재가, 평균매입가, ...

qtyz18는 1000으로 나눠야할수도?. QVOpenApi 기준으로 qtyz16가 일반적
잔고수량, ...

"평균매입가=매입금액/잔량"으로 계산할 수 있다.
이런식으로 유도되는 값이 존재하지만 DB에는 통째로 저장한다.
*/

export const name = "daily_holding";

export type NaiveName = SnakeCase<typeof name>;
export const naiveName: NaiveName = "daily_holding";

export interface Table {
  account_id: number;

  /** @summary 종목번호 */
  issue_code: string;

  date_kst: string;

  /**
   * @summary 잔고수량.
   * @example "75000" -> "75"
   */
  bal_qty: number;

  /** @summary 잔량 */
  jan_qty: number;

  /** @summary 미결제량 */
  unstl_qty: number;

  /** @summary 현재가 */
  prsnt_price: number;

  /** @summary 평균매입가 */
  slby_amt: number;

  /** @summary 평균매도가 */
  medo_slby_amt: number;

  /** @summary 평가금액 */
  ass_amt: number;

  /** @summary 매입금액 */
  byn_amt: number;

  /** @summary 매도손익 */
  post_lsnpf_amt: number;

  /** @summary 손익(원) */
  lsnpf_amt_won: number;

  /**
   * @summary 손익율
   * @example 1.255846717
   */
  earn_rate: number;

  /** @summary 신용유형 */
  mrgn_code: string;

  /**
   * @summary 대출일
   * @example 20240913
   */
  loan_date: string | null;

  /**
   * @summary 만기일
   * @example 20240913
   */
  expr_date: string | null;
}

export type Row = Selectable<Table>;
export type NewRow = Insertable<Table>;

export const primaryKey = ["date_kst", "account_id", "issue_code"] as const;

export const prepare = (db: Kysely<{ [name]: Table }>) =>
  db.schema
    .createTable(name)
    .ifNotExists()
    .addColumn("date_kst", "text")
    .addColumn("account_id", "integer")
    .addColumn("issue_code", "text")
    .addColumn("bal_qty", "integer")
    .addColumn("jan_qty", "integer")
    .addColumn("unstl_qty", "integer")
    .addColumn("prsnt_price", "integer")
    .addColumn("slby_amt", "integer")
    .addColumn("medo_slby_amt", "integer")
    .addColumn("ass_amt", "integer")
    .addColumn("byn_amt", "integer")
    .addColumn("post_lsnpf_amt", "integer")
    .addColumn("lsnpf_amt_won", "integer")
    .addColumn("earn_rate", "real")
    .addColumn("mrgn_code", "text")
    .addColumn("expr_date", "text")
    .addColumn("loan_date", "text")
    .addPrimaryKeyConstraint(`${name}_primary_key`, [...primaryKey]);
