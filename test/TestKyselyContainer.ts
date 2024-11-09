import { DataSource } from "typeorm";
import { entitySchemas } from "../entities/index.js";
import { Kysely, ParseJSONResultsPlugin } from "kysely";
import { TablePrefixPlugin } from "kysely-plugin-prefix";
import type { MyDatabase } from "../src/tables/index.js";
import { DialectFactory } from "../src/system/index.js";

export class TestKyselyContainer<T> {
  public readonly db: Kysely<T>;

  constructor(readonly dataSource: DataSource) {
    const dialect = DialectFactory.create_typeorm(dataSource);
    const plugins = [
      new ParseJSONResultsPlugin(),
      new TablePrefixPlugin({ prefix: "rio" }),
    ];

    this.db = new Kysely<T>({
      dialect,
      plugins,
    });
  }

  static create() {
    // TODO: sqljs + db export 조합하면 공용 테이블은 1번만 만들어서 재탕할수 있을듯?
    const dataSource = new DataSource({
      type: "better-sqlite3",
      database: ":memory:",
      entities: entitySchemas,
      // logging: "all",
    });

    return new TestKyselyContainer<MyDatabase>(dataSource);
  }

  async initialize() {
    await this.dataSource.initialize();
    await this.dataSource.synchronize();
  }

  async destroy() {
    await this.db.destroy();
  }
}
