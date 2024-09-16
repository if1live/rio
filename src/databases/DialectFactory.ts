import { MysqlDialect } from "kysely";
import { SqlJsDialect } from "kysely-wasm";
import type MysqlPkg from "mysql2";
import type SqlJsPkg from "sql.js";

// kysely는 db를 생성하는 함수를 dialect 생성 시점에 넣을 수 있다.
// database engine import를 await import로 사용하는거때문에
// db생성 코드가 전부 async/await 로 바뀌는거 피하고 싶어서 이렇게 구현
type CreateEngineFn<T> = () => Promise<T>;

type SqlJsParameters = [data: ArrayLike<number> | null];
const createEngine_sqljs = (
  ...args: SqlJsParameters
): CreateEngineFn<SqlJsPkg.Database> => {
  const [data] = args;
  return async () => {
    const { default: initSqlJs } = await import("sql.js");
    const SQL = await initSqlJs({});
    const database = new SQL.Database(data);
    return database;
  };
};

type MysqlParameters = Parameters<typeof MysqlPkg.createPool>;
const createEngine_mysql = (
  ...args: MysqlParameters
): CreateEngineFn<MysqlPkg.Pool> => {
  const [opts] = args;
  return async () => {
    // do not use 'mysql2/promises'!
    // mysql2/promise 사용시 hang 발생!
    const { createPool } = await import("mysql2");
    return createPool(opts);
  };
};

type Args_Generic<Tag, Input> = { _tag: Tag; input: Input };
type Args_SqlJs = Args_Generic<"sqljs", SqlJsParameters>;
type Args_Mysql = Args_Generic<"mysql", MysqlParameters>;
type Args = Args_SqlJs | Args_Mysql;

/**
 * better-sqlite3는 네이티브 플러그인이라서 node.js 버전을 바꾼다거나 꼬인다.
 * 반면 sql.js는 wasm이라서 대충 잘 돌아간다.
 * 유닛테스트 환경에서는 간단할수록 좋으니까 sql.js를 쓴다.
 * 성능 이슈, 메노리 이슈 생기면 그때 better-sqlite3 검토.
 */
export const create_sqljs = (data: ArrayLike<number> | null) => {
  const fn = createEngine_sqljs(data);
  const dialect = new SqlJsDialect({ database: fn });
  return dialect;
};

const create_mysql = (options: MysqlPkg.PoolOptions) => {
  const fn = createEngine_mysql(options);
  const dialect = new MysqlDialect({ pool: fn });
  return dialect;
};

const parse_sqljs = (url: URL): Args_SqlJs => {
  return {
    _tag: "sqljs",
    input: [new Uint8Array([])],
  };
};

const parse_mysql = (url: URL): Args_Mysql => {
  const isAwsLambda = !!process.env.LAMBDA_TASK_ROOT;
  const connectionLimit = isAwsLambda ? 1 : 5;

  const database = url.pathname.replace("/", "");
  const port: number | undefined =
    url.port !== "" ? Number.parseInt(url.port, 10) : undefined;

  const opts: MysqlParameters[0] = {
    database,
    host: url.hostname,
    user: url.username,
    password: url.password,
    port,
    connectionLimit,
    charset: "utf8mb4",
    timezone: "+00:00",
  };

  return {
    _tag: "mysql",
    input: [opts],
  };
};

export const parse = (input: string): Args => {
  try {
    const url = new URL(input);
    switch (url.protocol) {
      case "sqljs:":
        return parse_sqljs(url);
      case "mysql:":
        return parse_mysql(url);
      default:
        throw new Error(`Unsupported database URL: ${url.href}`);
    }
  } catch (e) {
    throw new Error(`Unsupported database URL: ${input}`);
  }
};

export const fromConnectionString = (
  input: string,
): SqlJsDialect | MysqlDialect => {
  const parsed = parse(input);
  switch (parsed._tag) {
    case "sqljs":
      return create_sqljs(...parsed.input);
    case "mysql":
      return create_mysql(...parsed.input);
  }
};
