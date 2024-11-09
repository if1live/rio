import type SQLitePkg from "better-sqlite3";
import {
  MysqlAdapter,
  MysqlDialect,
  MysqlIntrospector,
  MysqlQueryCompiler,
  PostgresAdapter,
  PostgresDialect,
  PostgresIntrospector,
  PostgresQueryCompiler,
  SqliteAdapter,
  SqliteDialect,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely";
import { SqlJsDialect } from "kysely-wasm";
import type * as KyselyTypeormType from "kysely-typeorm";
import type MysqlPkg from "mysql2";
import type PostgresPkg from "pg";
import type SqlJsPkg from "sql.js";
import type { DataSource } from "typeorm";

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

type PostgresParameters = Required<
  ConstructorParameters<typeof PostgresPkg.Pool>
>;
const createEngine_postgres = (
  ...args: PostgresParameters
): CreateEngineFn<PostgresPkg.Pool> => {
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
type Args_Postgres = Args_Generic<"postgres", PostgresParameters>;
type Args = Args_SqlJs | Args_Sqlite | Args_Mysql | Args_Postgres;

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

const create_postgres = (options: PostgresPkg.PoolConfig) => {
  const fn = createEngine_postgres(options);
  const dialect = new PostgresDialect({ pool: fn });
  return dialect;
};

type KyselySubDialect =
  KyselyTypeormType.KyselyTypeORMDialectConfig["kyselySubDialect"];
const create_subdialect = (
  tag: "sqlite" | "mysql" | "postgres",
): KyselySubDialect => {
  switch (tag) {
    case "sqlite":
      return {
        createAdapter: () => new SqliteAdapter(),
        createIntrospector: (db) => new SqliteIntrospector(db),
        createQueryCompiler: () => new SqliteQueryCompiler(),
      };
    case "mysql":
      return {
        createAdapter: () => new MysqlAdapter(),
        createIntrospector: (db) => new MysqlIntrospector(db),
        createQueryCompiler: () => new MysqlQueryCompiler(),
      };
    case "postgres":
      return {
        createAdapter: () => new PostgresAdapter(),
        createIntrospector: (db) => new PostgresIntrospector(db),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      };
  }
};

export const create_typeorm = (dataSource: DataSource) => {
  // dialect 객체 생성 단계에서는 async/await를 쓰고싶지 않다.
  // kysely-typeorm는 배포에 넣고 싶지 않다.
  const pkg = require("kysely-typeorm");
  const KyselyTypeORMDialect = pkg.KyselyTypeORMDialect as new (
    config: KyselyTypeormType.KyselyTypeORMDialectConfig,
  ) => KyselyTypeormType.KyselyTypeORMDialect;

  let kyselySubDialect: KyselySubDialect;
  switch (dataSource.options.type) {
    case "better-sqlite3":
    case "sqlite":
    case "sqljs":
      kyselySubDialect = create_subdialect("sqlite");
      break;
    case "mysql":
      kyselySubDialect = create_subdialect("mysql");
      break;
    case "postgres":
      kyselySubDialect = create_subdialect("postgres");
      break;
    default:
      throw new Error(`Unsupported database type: ${dataSource.options.type}`);
  }

  const dialect = new KyselyTypeORMDialect({
    kyselySubDialect,
    typeORMDataSource: dataSource,
    shouldInitializeDataSource: false,
    shouldDestroyDataSource: true,
  });
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

const parse_postgres = (url: URL): Args_Postgres => {
  const connectionLimit = isAwsLambda ? 1 : 5;
  const decoded = decodeUrl(url);

  const opts: PostgresParameters[0] = {
    ...decoded,
    max: connectionLimit,
  };

  return {
    _tag: "postgres",
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
      case "postgres:":
      case "postgresql:":
        return parse_postgres(url);
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
    case "postgres":
      return create_postgres(...parsed.input);
  }
};
