import path from "node:path";
import url from "node:url";
import { assert } from "@toss/assert";

export const NODE_ENV = process.env.NODE_ENV ?? "production";
export const STAGE = process.env.STAGE;

export const DATABASE_URL = process.env.DATABASE_URL;
assert(DATABASE_URL !== undefined, "DATABASE_URL is not set");

export const QVOPENAPI_ENDPOINT = process.env.QVOPENAPI_ENDPOINT;
assert(QVOPENAPI_ENDPOINT !== undefined, "QVOPENAPI_ENDPOINT is not set");

const ACCOUNT_COUNT_STR = process.env.ACCOUNT_COUNT;
assert(ACCOUNT_COUNT_STR !== undefined, "ACCOUNT_COUNT is not set");
export const ACCOUNT_COUNT = Number(ACCOUNT_COUNT_STR);

const findRootPath_lambda = (): string => process.env.LAMBDA_TASK_ROOT ?? "";

const findRootPath_dev = (): string => {
  // https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
  const filename = url.fileURLToPath(import.meta.url);
  const dirname = url.fileURLToPath(new URL(".", import.meta.url));
  const rootPath = path.join(dirname, "..", "..");
  return rootPath;
};

export const rootPath = process.env.LAMBDA_TASK_ROOT
  ? findRootPath_lambda()
  : findRootPath_dev();
