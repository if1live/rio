import { type FunctionDefinition, standalone } from "serverless-standalone";
import * as http_main from "./handlers/http_main.js";
import { db } from "./instances/index.js";
import { DailyHoldingTable, ProductTable } from "./tables/tables.js";

const stage = "dev";
const definitions: FunctionDefinition[] = [
  {
    name: `rio-${stage}-httpMain`,
    handler: http_main.handler,

    // 귀찮아서 모든 URL 대응
    events: [
      { httpApi: { route: "ANY /" } },
      { httpApi: { route: "ANY /{pathname+}" } },
    ],
  },
];

const options = {
  httpApi: { port: 3000 },
  // websocket: { port: 3001 },
  // lambda: { port: 3002 },
  // TODO: 필요해보기 직전까지 비활성화. 서버 돌릴기 귀찮아지는 문제가 있다.
  // iot: { mqtt: "mqtt://artemis:artemis@127.0.0.1:1883" },
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const db0 = db as unknown as any;
await ProductTable.prepare(db0).execute();
await DailyHoldingTable.prepare(db0).execute();

const inst = standalone({
  ...options,
  functions: definitions,
});
await inst.start();
console.log("standalone", options);
