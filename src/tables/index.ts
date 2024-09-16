import type { Generated } from "kysely";

export interface MyDatabase {
  person: PersonTable;
}

export interface PersonTable {
  id: Generated<number>;
  first_name: string;
  gender: "man" | "woman" | "other";
}
