import type { Insertable, Kysely, Selectable } from "kysely";
import type { SnakeCase } from "type-fest";

// financial products 금융상품은 길어서 짧게. 어차피 다른 product도 없을거고
export const name = "Product";

export type NaiveName = SnakeCase<typeof name>;
export const naiveName: NaiveName = "product";

export interface Table {
  /**
   * @summary 종목번호
   * @example "259960", "NHKRCMA030", "US78464A8541"
   */
  issue_code: string;

  /**
   * @summary 종목명
   * @example
   * - "SK하이닉스"
   * - "NH QV CMA 발행어음"
   * - "SPDR Portfolio S&P 500 ETF"
   * - "< 합   계 >"
   */
  issue_name: string;

  /**
   * @summary 국가코드명
   * @example "", "미국"
   */
  nat_cd_nm: string;

  /**
   * @summary 상품유형명
   * @example
   * - "주식"
   * - "외화ETP"
   * - "채권형펀드"
   * - "자유약정형 RP"
   */
  pdt_tp_nm: string;

  /**
   * @summary 통화코드
   * @example "", "KRW", "USD"
   */
  cur_cd: string;

  /**
   * @summary 종목중분류코드
   * @example "01001", "28001"
   */
  iem_mlf_cd: string;

  /**
   * @summary 잔고유형
   * @example "현금"
   */
  bal_type: string;

  /**
   * @summary 종목증거금율
   * @description RP, 외회ETP 에서는 null
   */
  issue_mgamt_rate: number | null;
}

export type Row = Selectable<Table>;
export type NewRow = Insertable<Table>;

export const prepare = (db: Kysely<{ [name]: Table }>) =>
  db.schema
    .createTable(name)
    .ifNotExists()
    .addColumn("issue_code", "text")
    .addColumn("issue_name", "text")
    .addColumn("nat_cd_nm", "text")
    .addColumn("pdt_tp_nm", "text")
    .addColumn("cur_cd", "text")
    .addColumn("iem_mlf_cd", "text")
    .addColumn("bal_type", "text")
    .addColumn("issue_mgamt_rate", "integer")
    .addPrimaryKeyConstraint(`${name}_primary_key`, ["issue_code"]);
