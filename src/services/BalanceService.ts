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
  const product_deposit: ProductTable.NewRow = {
    issue_code: "deposit",
    issue_name: "예수금",
    nat_cd_nm: "",
    pdt_tp_nm: "예수금",
    cur_cd: "",
    iem_mlf_cd: "",
    bal_type: "예수금",
    issue_mgamt_rate: null,
  };
  const products_real = responses
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
  await ProductRepository.upsert(db, [product_deposit, ...products_real]);

  for (let i = 0; i < responses.length; i++) {
    const accountId = i + 1;
    const resp = responses[i];
    assert(resp);

    // 예수금도 주식같이 보유한 항목처럼 처리. 테이블 분리하는게 나을듯?
    const depositNaive = resp.result.s8202OutBlock.dpsit_amt_d2_z18;
    const item_deposit: DailyHoldingTable.NewRow = {
      // primary key
      account_id: accountId,
      issue_code: "deposit",
      date_kst: today,
      // data
      bal_qty: depositNaive,
      jan_qty: depositNaive,
      unstl_qty: 0,
      prsnt_price: 0,
      slby_amt: 0,
      medo_slby_amt: 0,
      ass_amt: depositNaive,
      byn_amt: depositNaive,
      post_lsnpf_amt: 0,
      lsnpf_amt_won: 0,
      earn_rate: 0,
      mrgn_code: "예수금",
      loan_date: "",
      expr_date: "",
    };

    // 보유 항목
    const items_product = resp.result.s8202OutBlock1
      .filter((entry) => entry.issue_codez12.length > 0)
      .map((entry) => {
        const loan_date = transformNullableDate(entry.loan_datez8);
        const expr_date = transformNullableDate(entry.expr_datez8);

        // scale 조정은 일단 하드코딩으로 방어
        // 수량을 해외주식, IRP, ETF, 펀드는 1000으로 나눠야한다.
        // 원본 숫자 안건드리려고 했는데 IRP에서 integer overflow 발생해서 어쩔수 없이 대응
        const bal_qty = entry.bal_qtyz18 / 1000;
        const jan_qty = entry.jan_qtyz18 / 1000;
        const unstl_qty = entry.unstl_qtyz18 / 1000;

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

    const items = [item_deposit, ...items_product].filter((x) => x.byn_amt > 0);
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
  createdAt: Date | undefined;
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

  // 계좌별로 보고서
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

  // 종합 보고서
  const summary = AccountSummary.create({
    lsnpf_amt_won: R.sumBy(reports, (x) => x.summary.lsnpf_amt_won),
    ass_amt: R.sumBy(reports, (x) => x.summary.ass_amt),
    byn_amt: R.sumBy(reports, (x) => x.summary.byn_amt),
  });

  // 보유 상품은 한번에 갱신하니까 시간 아무거나 써도 된다
  // 시간이 없으면 db에 기록된게 없는 날
  const createdAtNaive = holdings[0]?.created_at as Date | string | undefined;
  const createdAt = createdAtNaive ? new Date(createdAtNaive) : undefined;

  return { summary, reports, createdAt };
};
