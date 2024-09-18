import type { DailyHoldingTable, ProductTable } from "../tables/tables.js";

export interface AccountSummary {
  /** @summary 손익(원) */
  lsnpf_amt_won: number;

  /** @summary 평가금액 */
  ass_amt: number;

  /** @summary 매입금액 */
  byn_amt: number;

  /** @summary 수익율(%) */
  pft_rt: number;
}

export const AccountSummary = {
  create(data: Omit<AccountSummary, "pft_rt">) {
    const pft_rt = ((data.ass_amt - data.byn_amt) / data.byn_amt) * 100;

    return {
      ...data,
      pft_rt,
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
