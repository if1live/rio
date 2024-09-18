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
        issue_codez12: entry.issue_codez12,
        issue_namez40: entry.issue_namez40,
        nat_cd_nmz40: entry.nat_cd_nmz40,
        pdt_tp_nmz50: entry.pdt_tp_nmz50,
        cur_cdz3: entry.cur_cdz3,
        iem_mlf_cdz5: entry.iem_mlf_cdz5,
        bal_typez6: entry.bal_typez6,
        issue_mgamt_ratez10: entry.issue_mgamt_ratez10,
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
        const loan_datez8 = transformNullableDate(entry.loan_datez8);
        const expr_datez8 = transformNullableDate(entry.expr_datez8);

        const row: DailyHoldingTable.NewRow = {
          // primary key
          account_id: accountId,
          issue_codez12: entry.issue_codez12,
          date: today,
          // data
          bal_qtyz18: entry.bal_qtyz18,
          jan_qtyz18: entry.jan_qtyz18,
          unstl_qtyz18: entry.unstl_qtyz18,
          prsnt_pricez18: entry.prsnt_pricez18,
          slby_amtz18: entry.slby_amtz18,
          medo_slby_amtz18: entry.medo_slby_amtz18,
          ass_amtz18: entry.ass_amtz18,
          byn_amtz18: entry.byn_amtz18,
          post_lsnpf_amtz18: entry.post_lsnpf_amtz18,
          lsnpf_amt_wonz18: entry.lsnpf_amt_wonz18,
          earn_ratez15: entry.earn_ratez15,
          mrgn_codez4: entry.mrgn_codez4,
          loan_datez8,
          expr_datez8,
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
): Promise<AccountDailyReport[]> => {
  // db에서 재구성 테스트
  const holdings = await DailyHoldingRepository.findByDate(db, today);

  const productIds = holdings.map((x) => x.issue_codez12);
  const products = await ProductRepository.findByIds(db, productIds);
  const productMap = new Map<string, ProductTable.Row>(
    products.map((x) => [x.issue_codez12, x]),
  );

  const accountIds = R.pipe(
    holdings,
    R.map((x) => x.account_id),
    R.unique(),
  );

  const results = accountIds.map((accountId) => {
    const founds = holdings.filter((x) => x.account_id === accountId);
    const snapshots = founds.map((found) => {
      const product = productMap.get(found.issue_codez12);
      assert(product);

      return {
        product,
        holding: found,
      };
    });

    const summary = AccountSummary.create({
      lsnpf_amt_wonz18: R.sumBy(snapshots, (x) => x.holding.lsnpf_amt_wonz18),
      ass_amtz18: R.sumBy(snapshots, (x) => x.holding.ass_amtz18),
      byn_amtz18: R.sumBy(snapshots, (x) => x.holding.byn_amtz18),
    });

    return {
      accountId,
      summary,
      snapshots,
    };
  });

  return results;
};
