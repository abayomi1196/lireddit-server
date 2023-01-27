import { MikroORM } from "@mikro-orm/core";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import mikroOrmConfig from "./mikro-orm.config";
import { HelloResolver } from "./resolvers/hello";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);

  orm.getMigrator().up();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver],
      validate: false
    })
  });

  const { url } = await startStandaloneServer(apolloServer, {
    listen: { port: 4000 }
  });

  console.log(`🚀 Server ready at: ${url}`);
};

main().catch((err) => console.error(err));
