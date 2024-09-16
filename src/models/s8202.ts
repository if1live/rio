import type { MessageBlock } from "./shared.js";

export interface S8202Request {
  account_index: number;
}

export interface S8202OutBlock {
  /** @summary 예수금 */
  dpsit_amtz18: number;

  /** @summary 신용융자금 */
  mrgn_amtz18: number;

  /** @summary 이자미납금 */
  mgint_npaid_amtz18: number;

  /** @summary 출금가능금액 */
  chgm_pos_amtz18: number;

  /** @summary 현금증거금 */
  cash_mrgn_amtz18: number;

  /** @summary 대용증거금 */
  subst_mgamt_amtz18: number;

  /** @summary 담보비율 */
  coltr_ratez11: number;

  /** @summary 현금미수금 */
  rcble_amtz18: number;

  /** @summary 주문가능액 */
  order_pos_csamtz18: number;

  /** @summary 미상환금 */
  nordm_loan_amtz18: number;

  /** @summary 기타대여금 */
  etc_lend_amtz18: number;

  /** @summary 대용금액 */
  subst_amtz18: number;

  /** @summary 대주담보금 */
  sln_sale_amtz18: number;

  /** @summary 매입원가(계좌합산) */
  bal_buy_ttamtz18: number;

  /** @summary 평가금액(계좌합산) */
  bal_ass_ttamtz18: number;

  /** @summary 순자산액(계좌합산) */
  asset_tot_amtz18: number;

  /** @summary 활동유형 */
  actvt_type10: string;

  /** @summary 대출금 */
  lend_amtz18: number;

  /** @summary 매도증거금 */
  sl_mrgn_amtz18: number;

  /** @summary 20%주문가능금액 */
  pos_csamt1z18: number;

  /** @summary 30%주문가능금액 */
  pos_csamt2z18: number;

  /** @summary 40%주문가능금액 */
  pos_csamt3z18: number;

  /** @summary 100%주문가능금액 */
  pos_csamt4z18: number;

  /** @summary D1예수금 */
  dpsit_amt_d1_z15: number;

  /** @summary D2예수금 */
  dpsit_amt_d2_z18: number;

  /** @summary 총평가손익 */
  tot_eal_plsz15: number;

  /** @summary 수익율 */
  pft_rtz15: number;

  /** @summary 손익(원) */
  lsnpf_amt_wonz15: number;
}

export interface s8202OutBlock1 {
  /** @summary 종목번호 */
  issue_codez12: string;

  /** @summary 종목명 */
  issue_namez40: string;

  /** @summary 잔고유형 */
  bal_typez6: string;

  /** @summary 대출일 */
  loan_datez8: string;

  /** @summary 잔고수량 */
  bal_qtyz18: number;

  /** @summary 미결제량 */
  unstl_qtyz18: number;

  /** @summary 평균매입가 */
  slby_amtz18: number;

  /** @summary 매입금액 */
  byn_amtz18: number;

  /** @summary 현재가 */
  prsnt_pricez18: number;

  /** @summary 손익(천원) */
  lsnpf_amtz18: number;

  /** @summary 손익(원) */
  lsnpf_amt_wonz18: number;

  /** @summary 손익율 */
  earn_ratez15: number;

  /** @summary 신용유형 */
  mrgn_codez4: string;

  /** @summary 잔량 */
  jan_qtyz18: number;

  /** @summary 만기일 */
  expr_datez8: string;

  /** @summary 평가금액 */
  ass_amtz18: string;

  /** @summary 종목증거금율 */
  issue_mgamt_ratez10: string | null;

  /** @summary 평균매도가 */
  medo_slby_amtz18: number;

  /** @summary 매도손익 */
  post_lsnpf_amtz18: number;

  /** @summary 통화코드 */
  cur_cdz3: string;

  /** @summary 국가코드명 */
  nat_cd_nmz40: string;

  /** @summary 상품유형명 */
  pdt_tp_nmz50: string;

  /** @summary 종목중분류코드 */
  iem_mlf_cdz5: string;
}

export interface S8202Response {
  error_type: null;
  errors: [];
  messages: MessageBlock[];
  result: {
    s8202OutBlock: S8202OutBlock;
    s8202OutBlock1: s8202OutBlock1[];
  };
}
