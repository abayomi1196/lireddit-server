import { DataSource } from "typeorm";
import path from "path";

import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { Updoot } from "./entities/Updoot";

const dataSource = new DataSource({
  type: "postgres",
  database: "lireddit2",
  username: "postgres",
  password: "abelTesfaaye301",
  logging: true,
  synchronize: true,
  migrations: [path.join(__dirname, "./migrations/*")],
  entities: [Post, User, Updoot]
});

export default dataSource;
