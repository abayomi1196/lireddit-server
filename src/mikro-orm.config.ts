import { defineConfig } from "@mikro-orm/core";
import path from "path";

import { Post } from "./entitites/Post";
import { __isProd__ } from "./constants";

export default defineConfig({
  entities: [Post],
  dbName: "lireddit",
  type: "postgresql",
  debug: !__isProd__,
  password: "abelTesfaaye301",
  allowGlobalContext: true,
  migrations: {
    path: path.join(__dirname + "/migrations"),
    glob: "!(*.d).{js,ts}"
  }
});
