import { MikroORM } from "@mikro-orm/core";

import { __isProd__ } from "./constants";
import { Post } from "./entitites/Post";

const main = async () => {
  const orm = await MikroORM.init({
    dbName: "lireddit",
    type: "postgresql",
    debug: !__isProd__,
    entities: [Post]
  });

  const post = orm.em.create(Post, {
    title: "fist post",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await orm.em.persistAndFlush(post);
};

main().catch((err) => console.error(err));
