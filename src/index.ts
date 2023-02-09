import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "@apollo/server";
import http from "http";
import cors from "cors";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";

import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import { createClient } from "redis";
import connectRedis from "connect-redis";

import mikroOrmConfig from "./mikro-orm.config";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { __isProd__ } from "./constants";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  orm.getMigrator().up();

  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  const RedisStore = connectRedis(session);
  const redisClient = createClient({ legacyMode: true });
  await redisClient
    .on("error", (err) => console.error(`Redis error: ${err}`))
    .on("connect", () => console.info("Redis connected"))
    .connect()
    .catch((err) => console.error("Redis Client Error", err));

  app.set("Access-Control-Allow-Origin", "https://studio.apollographql.com");
  app.set("Access-Control-Allow-Credentials", true);

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true
      }),
      cookie: {
        maxAge: 10000 * 60 * 60 * 24 * 365 * 10, //10 yrs
        httpOnly: true,
        sameSite: "lax",
        secure: __isProd__ // cookie only works in https
      },
      saveUninitialized: false,
      secret: "keyboard cat",
      resave: false
    })
  );

  const httpServer = http.createServer(app);

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false
    }),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ includeCookies: true })
    ]
  });

  await apolloServer.start();

  app.use(
    "/",
    cors<cors.CorsRequest>({
      origin: [
        "http://localhost:6380/",
        "'https://studio.apollographql.com', 'ws://localhost:6380/'"
      ],
      credentials: true
    }),
    bodyParser.json({ limit: "50mb" }),
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => ({ em: orm.em, req, res })
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 6380 }, resolve)
  );
  console.log(`🚀 Server ready at http://localhost:6380/`);
};

main().catch((err) => console.error(err));
