import { assert } from "@toss/assert";
import {
  CamelCasePlugin,
  type Dialect,
  Kysely,
  type KyselyConfig,
  type KyselyPlugin,
  ParseJSONResultsPlugin,
} from "kysely";
import { SqlJsDialect } from "kysely-wasm";
import { DialectFactory } from "../databases/index.js";
import { settings } from "../settings/index.js";
import type { MyDatabase } from "../tables/index.js";

const plugins_common: KyselyPlugin[] = [
  new ParseJSONResultsPlugin(),
  new CamelCasePlugin(),
];

const options: Omit<KyselyConfig, "dialect"> = {
  // log: ["query", "error"],
};

const createKysely = <T>(dialect: Dialect) => {
  let plugins: KyselyPlugin[] = plugins_common;
  if (dialect instanceof SqlJsDialect) {
    plugins = [...plugins_common];
  }

  return new Kysely<T>({
    dialect,
    plugins,
    ...options,
  });
};

const fn_real = <T>(input: string) => {
  const dialect = DialectFactory.fromConnectionString(input);
  const db = createKysely<T>(dialect);
  return db;
};

const create_real = <T>() => {
  const databaseUrl = settings.DATABASE_URL;
  assert(databaseUrl !== undefined, "DATABASE_URL is not set");

  const db = fn_real<T>(databaseUrl);
  return { db };
};

const create_test = <T>() => {
  const buffer = new Uint8Array([]);
  const dialect = DialectFactory.create_sqljs(buffer);
  const db = createKysely<T>(dialect);
  return { db };
};

const create = () => {
  return settings.NODE_ENV === "test"
    ? create_test<MyDatabase>()
    : create_real<MyDatabase>();
};

const result = create();
export const { db } = result;
