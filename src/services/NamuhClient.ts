import type { S8202Request, S8202Response } from "../models/index.js";
import { settings } from "../settings/index.js";

export const fetch_s8202 = async (accountIndex: number) => {
  const base = settings.QVOPENAPI_ENDPOINT;
  const path = "/query/s8202";
  const endpoint = `${base}${path}`;

  const req: S8202Request = {
    account_index: accountIndex,
  };
  const body = JSON.stringify(req);

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
  const json = await resp.json();
  return json as S8202Response;
};
