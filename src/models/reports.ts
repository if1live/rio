import type { DailyHoldingTable, ProductTable } from "../tables/tables.js";

export interface AccountSummary {
  /** @summary 손익(원) */
  lsnpf_amt_won: number;

  /** @summary 평가금액 */
  ass_amt: number;

  /** @summary 매입금액 */
  byn_amt: number;

  /** @summary 수익율(%) */
  earn_rate: number;
}

export const AccountSummary = {
  create(data: Omit<AccountSummary, "earn_rate">) {
    const earn_rate = ((data.ass_amt - data.byn_amt) / data.byn_amt) * 100;

    return {
      ...data,
      earn_rate,
    };
  },
};

export interface AccountDailyReport {
  accountId: number;
  summary: AccountSummary;
  snapshots: Array<{
    product: ProductTable.Row;
    holding: DailyHoldingTable.Row;
  }>;
}
