import type { Insertable, Kysely, Selectable } from "kysely";

/*
flaot 정밀도 이슈를 피하려고 서버에서 받은걸 그대로 받아서 대응

amtz18은 100으로 나눠야할수도? QVOpenApi 기준으로 amtz16가 일반적
현재가, 평균매입가, ...

qtyz18는 1000으로 나눠야할수도?. QVOpenApi 기준으로 qtyz16가 일반적
잔고수량, ...

"평균매입가=매입금액/잔량"으로 계산할 수 있다.
이런식으로 유도되는 값이 존재하지만 DB에는 통째로 저장한다.
*/

export const name = "DailyHolding";

export type NaiveName = "daily_holding";
export const naiveName: NaiveName = "daily_holding";

export interface Table {
  account_id: number;

  /** @summary 종목번호 */
  issue_codez12: string;

  date: string;

  /**
   * @summary 잔고수량.
   * @example "75000" -> "75"
   */
  bal_qtyz18: number;

  /** @summary 잔량 */
  jan_qtyz18: number;

  /** @summary 미결제량 */
  unstl_qtyz18: number;

  /** @summary 현재가 */
  prsnt_pricez18: number;

  /** @summary 평균매입가 */
  slby_amtz18: number;

  /** @summary 평균매도가 */
  medo_slby_amtz18: number;

  /** @summary 평가금액 */
  ass_amtz18: number;

  /** @summary 매입금액 */
  byn_amtz18: number;

  /** @summary 매도손익 */
  post_lsnpf_amtz18: number;

  /** @summary 손익(원) */
  lsnpf_amt_wonz18: number;

  /**
   * @summary 손익율
   * @example 1.255846717
   */
  earn_ratez15: number;

  /** @summary 신용유형 */
  mrgn_codez4: string;

  /**
   * @summary 대출일
   * @example 20240913
   */
  loan_datez8: string | null;

  /**
   * @summary 만기일
   * @example 20240913
   */
  expr_datez8: string | null;
}

export type Row = Selectable<Table>;
export type NewRow = Insertable<Table>;

export const prepare = (db: Kysely<{ [name]: Table }>) =>
  db.schema
    .createTable(name)
    .ifNotExists()
    .addColumn("account_id", "integer")
    .addColumn("issue_codez12", "text")
    .addColumn("date", "text")
    .addColumn("bal_qtyz18", "integer")
    .addColumn("jan_qtyz18", "integer")
    .addColumn("unstl_qtyz18", "integer")
    .addColumn("prsnt_pricez18", "integer")
    .addColumn("slby_amtz18", "integer")
    .addColumn("medo_slby_amtz18", "integer")
    .addColumn("ass_amtz18", "integer")
    .addColumn("byn_amtz18", "integer")
    .addColumn("post_lsnpf_amtz18", "integer")
    .addColumn("lsnpf_amt_wonz18", "integer")
    .addColumn("earn_ratez15", "real")
    .addColumn("mrgn_codez4", "text")
    .addColumn("expr_datez8", "text")
    .addColumn("loan_datez8", "text")
    .addPrimaryKeyConstraint(`${name}_primary_key`, [
      "account_id",
      "issue_codez12",
      "date",
    ])
    .addUniqueConstraint(`${name}_unique`, [
      "account_id",
      "date",
      "issue_codez12",
    ]);
