import type { CamelCasedProperties } from "type-fest";
import type {
  MessageResponse,
  S8202Request,
  S8202Response,
} from "../models/index.js";
import { settings } from "../settings/index.js";

export const fetch_s8202 = async (
  req: CamelCasedProperties<S8202Request>,
): Promise<S8202Response> => {
  const base = settings.QVOPENAPI_ENDPOINT;
  const path = "/query/s8202";
  const endpoint = `${base}${path}`;

  const req0: S8202Request = {
    account_index: req.accountIndex,
  };
  const body = JSON.stringify(req0);

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    signal: AbortSignal.timeout(3_000),
  });

  const status = resp.status;
  const text = await resp.text();
  if (status >= 400) {
    console.error(text);
    throw new Error(`Error occurred while fetching s8202: ${status}`);
  }

  const json = JSON.parse(text);
  const data = json as S8202Response | MessageResponse;
  if ("message" in data) {
    console.error(text);
    console.error(data.message);
    throw new Error(data.message);
  }
  return data;
};
