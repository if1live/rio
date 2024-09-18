import { assert } from "@toss/assert";
import * as R from "remeda";
import {
  type AccountDailyReport,
  AccountSummary,
  type S8202Response,
} from "../models/index.js";
import {
  DailyHoldingRepository,
  ProductRepository,
} from "../repositories/index.js";
import type { MyKysely } from "../tables/index.js";
import type { DailyHoldingTable, ProductTable } from "../tables/tables.js";

export const save = async (
  db: MyKysely,
  responses: S8202Response[],
  today: string,
) => {
  const products = responses
    .flatMap((entry) => entry.result.s8202OutBlock1)
    .filter((entry) => entry.issue_codez12.length > 0)
    .map((entry) => {
      const product: ProductTable.NewRow = {
        issue_code: entry.issue_codez12,
        issue_name: entry.issue_namez40,
        nat_cd_nm: entry.nat_cd_nmz40,
        pdt_tp_nm: entry.pdt_tp_nmz50,
        cur_cd: entry.cur_cdz3,
        iem_mlf_cd: entry.iem_mlf_cdz5,
        bal_type: entry.bal_typez6,
        issue_mgamt_rate: entry.issue_mgamt_ratez10,
      };
      return product;
    });
  await ProductRepository.upsert(db, products);

  for (let i = 0; i < responses.length; i++) {
    const accountId = i + 1;
    const resp = responses[i];
    assert(resp);

    const items = resp.result.s8202OutBlock1
      .filter((entry) => entry.issue_codez12.length > 0)
      .map((entry) => {
        const loan_date = transformNullableDate(entry.loan_datez8);
        const expr_date = transformNullableDate(entry.expr_datez8);

        // scale 조정은 일단 하드코딩으로 방어
        // 수량을 해외주식, IRP, ETF, 펀드는 1000으로 나눠야한다.
        // 원본 숫자 안건드리려고 했는데 IRP에서 integer overflow 발생해서 어쩔수 없이 대응
        // bigint로 바꾸면 일이 너무 커져서 그냥 숫자를 변환한다.
        const quantityScale = entry.pdt_tp_nmz50 === "주식" ? 100 : 1000;
        const bal_qty = entry.bal_qtyz18 / quantityScale;
        const jan_qty = entry.jan_qtyz18 / quantityScale;
        const unstl_qty = entry.unstl_qtyz18 / quantityScale;

        const row: DailyHoldingTable.NewRow = {
          // primary key
          account_id: accountId,
          issue_code: entry.issue_codez12,
          date_kst: today,
          // data
          bal_qty: bal_qty,
          jan_qty: jan_qty,
          unstl_qty: unstl_qty,
          prsnt_price: entry.prsnt_pricez18,
          slby_amt: entry.slby_amtz18,
          medo_slby_amt: entry.medo_slby_amtz18,
          ass_amt: entry.ass_amtz18,
          byn_amt: entry.byn_amtz18,
          post_lsnpf_amt: entry.post_lsnpf_amtz18,
          lsnpf_amt_won: entry.lsnpf_amt_wonz18,
          earn_rate: entry.earn_ratez15,
          mrgn_code: entry.mrgn_codez4,
          loan_date,
          expr_date,
        };
        return row;
      });
    await DailyHoldingRepository.upsert(db, items);
  }
};

// "20240830" -> "2024-08-30"
const transformDate = (input: string) => {
  const y = input.slice(0, 4);
  const m = input.slice(4, 6);
  const d = input.slice(6, 8);
  return `${y}-${m}-${d}`;
};

const transformNullableDate = (input: string | null) => {
  if (input == null) return null;
  if (input === "") return null;
  return transformDate(input);
};

export const load = async (
  db: MyKysely,
  today: string,
): Promise<{
  summary: AccountSummary;
  reports: AccountDailyReport[];
}> => {
  // db에서 재구성 테스트
  const holdings = await DailyHoldingRepository.findByDate(db, today);

  const productIds = holdings.map((x) => x.issue_code);
  const products = await ProductRepository.findByIds(db, productIds);
  const productMap = new Map<string, ProductTable.Row>(
    products.map((x) => [x.issue_code, x]),
  );

  const accountIds = R.pipe(
    holdings,
    R.map((x) => x.account_id),
    R.unique(),
  );

  const reports = accountIds.map((accountId) => {
    const founds = holdings.filter((x) => x.account_id === accountId);
    const snapshots = founds.map((found) => {
      const product = productMap.get(found.issue_code);
      assert(product);

      return {
        product,
        holding: found,
      };
    });

    const summary = AccountSummary.create({
      lsnpf_amt_won: R.sumBy(snapshots, (x) => x.holding.lsnpf_amt_won),
      ass_amt: R.sumBy(snapshots, (x) => x.holding.ass_amt),
      byn_amt: R.sumBy(snapshots, (x) => x.holding.byn_amt),
    });

    return {
      accountId,
      summary,
      snapshots,
    };
  });

  const summary = AccountSummary.create({
    lsnpf_amt_won: R.sumBy(reports, (x) => x.summary.lsnpf_amt_won),
    ass_amt: R.sumBy(reports, (x) => x.summary.ass_amt),
    byn_amt: R.sumBy(reports, (x) => x.summary.byn_amt),
  });

  return { summary, reports };
};
