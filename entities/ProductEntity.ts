import { Column, Entity, PrimaryColumn } from "typeorm";

// financial products 금융상품은 길어서 짧게. 어차피 다른 product도 없을거고
@Entity({ name: "rio_product" })
export class ProductEntity {
  /**
   * @summary 종목번호
   * @example "259960", "NHKRCMA030", "US78464A8541"
   */
  @PrimaryColumn({ primaryKeyConstraintName: "rio_product_pkey", length: 12 })
  issue_code!: string;

  /**
   * @summary 종목명
   * @example
   * - "SK하이닉스"
   * - "NH QV CMA 발행어음"
   * - "SPDR Portfolio S&P 500 ETF"
   * - "< 합   계 >"
   */
  @Column({ length: 40 })
  issue_name!: string;

  /**
   * @summary 국가코드명
   * @example "", "미국"
   */
  @Column({ length: 40 })
  nat_cd_nm!: string;

  /**
   * @summary 상품유형명
   * @example
   * - "주식"
   * - "외화ETP"
   * - "채권형펀드"
   * - "자유약정형 RP"
   */
  @Column({ length: 50 })
  pdt_tp_nm!: string;

  /**
   * @summary 통화코드
   * @example "", "KRW", "USD"
   */
  @Column({ length: 3 })
  cur_cd!: string;

  /**
   * @summary 종목중분류코드
   * @example "01001", "28001"
   */
  @Column({ length: 5 })
  iem_mlf_cd!: string;

  /**
   * @summary 잔고유형
   * @example "현금"
   */
  @Column({ length: 6 })
  bal_type!: string;

  /**
   * @summary 종목증거금율
   * @description RP, 외회ETP 에서는 null
   */
  @Column({ type: "int", nullable: true })
  issue_mgamt_rate!: number | null;
}
