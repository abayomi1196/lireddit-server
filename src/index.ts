import { MikroORM } from "@mikro-orm/core";

import { Post } from "./entitites/Post";
import mikroOrmConfig from "./mikro-orm.config";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);

  orm.getMigrator().up();

  // const post = orm.em.create(Post, {
  //   title: "fist post",
  //   createdAt: new Date(),
  //   updatedAt: new Date()
  // });

  // await orm.em.persistAndFlush(post);

  // const posts = await orm.em.find(Post, {});

  // console.log(posts);
};

main().catch((err) => console.error(err));
