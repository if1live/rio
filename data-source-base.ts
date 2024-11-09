import "reflect-metadata";
import { DataSource } from "typeorm";
import { entitySchemas } from "./entities/index.js";

/*
typeorm cli를 사용할때 아무 인자나 cli로 넣을 수 없다.
Unknown argument: engine
어쩔수 없이 data source 별로 파일을 나눈다.
*/

const opts = {
  entities: entitySchemas,

  // migration 생성 목적으로만 사용할거라 synchronize 비활성화
  synchronize: false,
  logging: false,

  // rdbms에서 테이블 목록 뽑았을때 뒤섞이는거 피하고 싶어서 특수한 이름 사용
  // 쓸 수 있는 prefix는 현실적으로 0 or z 밖에 없고 둘 중에는 0이 나을듯
  // z는 진짜로 테이블 이름에서 사용될지 모르니까
  migrationsTableName: "00_migrations_rio",

  migrations: ["migrations/*.ts"],
  subscribers: ["subscribers/*.ts"],
};

export const create_sqlite = () => {
  return new DataSource({
    type: "better-sqlite3",
    database: "sqlite.db",
    ...opts,
  });
};
