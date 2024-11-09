import { describe, it, assert, beforeAll, afterAll } from "vitest";
import { TestKyselyContainer } from "../TestKyselyContainer.js";
import { ProductRepository } from "../../src/repositories/index.js";

describe("ProductRepository", () => {
  const testdb = TestKyselyContainer.create();
  const db = testdb.db;

  beforeAll(async () => {
    await testdb.initialize();
  });

  afterAll(async () => {
    await testdb.destroy();
  });

  it("ok", async () => {
    const founds = await ProductRepository.findByIds(db, ["1", "2"]);
    assert.strictEqual(founds.length, 0);
  });
});
