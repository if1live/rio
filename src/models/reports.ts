import type { DailyHoldingTable, ProductTable } from "../tables/tables.js";

export interface AccountSummary {
  /** @summary 손익(원) */
  lsnpf_amt_wonz18: number;

  /** @summary 평가금액 */
  ass_amtz18: number;

  /** @summary 매입금액 */
  byn_amtz18: number;

  /** @summary 수익율(%) */
  pft_rtz15: number;
}

export const AccountSummary = {
  create(data: Omit<AccountSummary, "pft_rtz15">) {
    const pft_rtz15 =
      ((data.ass_amtz18 - data.byn_amtz18) / data.byn_amtz18) * 100;

    return {
      ...data,
      pft_rtz15,
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
