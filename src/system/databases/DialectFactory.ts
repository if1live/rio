import type SQLitePkg from "better-sqlite3";
import { MysqlDialect, PostgresDialect, SqliteDialect } from "kysely";
import { SqlJsDialect } from "kysely-wasm";
import type MysqlPkg from "mysql2";
import type PgPkg from "pg";
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

type SQLiteParamters = [fiilename: string, options?: SQLitePkg.Options];
const createEngine_sqlite = (
  ...args: SQLiteParamters
): CreateEngineFn<SQLitePkg.Database> => {
  const [filename, options] = args;
  return async () => {
    const { default: SQLite } = await import("better-sqlite3");
    return new SQLite(filename, options);
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

type PgParameters = Required<ConstructorParameters<typeof PgPkg.Pool>>;
const createEngine_pg = (...args: PgParameters): CreateEngineFn<PgPkg.Pool> => {
  const [opts] = args;
  return async () => {
    const { Pool } = await import("pg");
    return new Pool(opts);
  };
};

type Args_Generic<Tag, Input> = { _tag: Tag; input: Input };
type Args_SqlJs = Args_Generic<"sqljs", SqlJsParameters>;
type Args_Sqlite = Args_Generic<"sqlite", SQLiteParamters>;
type Args_Mysql = Args_Generic<"mysql", MysqlParameters>;
type Args_Pg = Args_Generic<"pg", PgParameters>;
type Args = Args_SqlJs | Args_Sqlite | Args_Mysql | Args_Pg;

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

const create_sqlite = (filename: string, options?: SQLitePkg.Options) => {
  const fn = createEngine_sqlite(filename, options);
  const dialect = new SqliteDialect({ database: fn });
  return dialect;
};

const create_mysql = (options: MysqlPkg.PoolOptions) => {
  const fn = createEngine_mysql(options);
  const dialect = new MysqlDialect({ pool: fn });
  return dialect;
};

const create_pg = (options: PgPkg.PoolConfig) => {
  const fn = createEngine_pg(options);
  const dialect = new PostgresDialect({ pool: fn });
  return dialect;
};

const parse_sqljs = (url: URL): Args_SqlJs => {
  return {
    _tag: "sqljs",
    input: [new Uint8Array([])],
  };
};

const parse_sqlite = (url: URL): Args_Sqlite => {
  const pathname = url.pathname.startsWith("/")
    ? url.pathname.slice(1, url.pathname.length)
    : url.pathname;

  return {
    _tag: "sqlite",
    input: [pathname],
  };
};

const isAwsLambda = !!process.env.LAMBDA_TASK_ROOT;

const decodeUrl = (url: URL) => {
  const database = url.pathname.replace("/", "");
  const port: number | undefined =
    url.port !== "" ? Number.parseInt(url.port, 10) : undefined;

  return {
    database,
    host: url.hostname,
    user: url.username,
    password: url.password,
    port,
  };
};

const parse_mysql = (url: URL): Args_Mysql => {
  const connectionLimit = isAwsLambda ? 1 : 5;
  const decoded = decodeUrl(url);

  const opts: MysqlParameters[0] = {
    ...decoded,
    connectionLimit,
    charset: "utf8mb4",
    timezone: "+00:00",
  };

  return {
    _tag: "mysql",
    input: [opts],
  };
};

const parse_pg = (url: URL): Args_Pg => {
  const connectionLimit = isAwsLambda ? 1 : 5;
  const decoded = decodeUrl(url);

  const opts: PgParameters[0] = {
    ...decoded,
    max: connectionLimit,
  };

  return {
    _tag: "pg",
    input: [opts],
  };
};

export const parse = (input: string): Args => {
  try {
    const url = new URL(input);
    switch (url.protocol) {
      case "sqljs:":
        return parse_sqljs(url);
      case "sqlite:":
        return parse_sqlite(url);
      case "mysql:":
        return parse_mysql(url);
      case "pg:":
        return parse_pg(url);
      default:
        throw new Error(`Unsupported database URL: ${url.href}`);
    }
  } catch (e) {
    throw new Error(`Unsupported database URL: ${input}`);
  }
};

export const fromConnectionString = (
  input: string,
): SqlJsDialect | SqliteDialect | MysqlDialect | PostgresDialect => {
  const parsed = parse(input);
  switch (parsed._tag) {
    case "sqljs":
      return create_sqljs(...parsed.input);
    case "sqlite":
      return create_sqlite(...parsed.input);
    case "mysql":
      return create_mysql(...parsed.input);
    case "pg":
      return create_pg(...parsed.input);
  }
};
