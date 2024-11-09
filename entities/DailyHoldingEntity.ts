import type { Generated } from "kysely-typeorm";
import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

// @PrimaryColumn("rio_daily_holding_primary_key", [
// export const primaryKey = ["date_kst", "account_id", "issue_code"] as const;

/*
flaot 정밀도 이슈를 피하려고 서버에서 받은걸 그대로 받아서 대응

amtz18은 100으로 나눠야할수도? QVOpenApi 기준으로 amtz16가 일반적
현재가, 평균매입가, ...

qtyz18는 1000으로 나눠야할수도?. QVOpenApi 기준으로 qtyz16가 일반적
잔고수량, ...

"평균매입가=매입금액/잔량"으로 계산할 수 있다.
이런식으로 유도되는 값이 존재하지만 DB에는 통째로 저장한다.
*/

/**
 * primary key를 composite key로 만들 경우 같은 이름으로 전부 채워야한다.
 * supabase table editor로 테이블 만들면 'rio_daily_holding_pkey' 같은 pk가 된다.
 * migration할때 오차를 없애려고 테이블 이름을 똑같이 한다.
 */
const primaryKeyConstraintName = "rio_daily_holding_pkey";

@Entity({ name: "rio_daily_holding" })
export class DailyHoldingEntity {
  @PrimaryColumn({ length: 10, primaryKeyConstraintName })
  date_kst!: string;

  @PrimaryColumn({ primaryKeyConstraintName })
  account_id!: number;

  /** @summary 종목번호 */
  @PrimaryColumn({ length: 12, primaryKeyConstraintName })
  issue_code!: string;

  /**
   * @summary 잔고수량.
   * @example "75000" -> "75"
   */
  @Column()
  bal_qty!: number;

  /** @summary 잔량 */
  @Column()
  jan_qty!: number;

  /** @summary 미결제량 */
  @Column()
  unstl_qty!: number;

  /** @summary 현재가 */
  @Column()
  prsnt_price!: number;

  /** @summary 평균매입가 */
  @Column()
  slby_amt!: number;

  /** @summary 평균매도가 */
  @Column()
  medo_slby_amt!: number;

  /** @summary 평가금액 */
  @Column()
  ass_amt!: number;

  /** @summary 매입금액 */
  @Column()
  byn_amt!: number;

  /** @summary 매도손익 */
  @Column()
  post_lsnpf_amt!: number;

  /** @summary 손익(원) */
  @Column()
  lsnpf_amt_won!: number;

  /**
   * @summary 손익율
   * @example 1.255846717
   */
  @Column()
  earn_rate!: number;

  /** @summary 신용유형 */
  @Column({ type: "varchar", length: 4 })
  mrgn_code!: string;

  /**
   * @summary 대출일
   * @example 20240913 -> 2024-09-13
   */
  @Column({ type: "varchar", length: 10, nullable: true })
  loan_date!: string | null;

  /**
   * @summary 만기일
   * @example 20240913 -> 2024-09-13
   */
  @Column({ type: "varchar", length: 10, nullable: true })
  expr_date!: string | null;

  @CreateDateColumn({ type: Date })
  created_at!: Generated<Date>;
}
