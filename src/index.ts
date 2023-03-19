import "reflect-metadata";
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
import Redis from "ioredis";
import connectRedis from "connect-redis";

import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { COOKIE_NAME, __isProd__ } from "./constants";
import dataSource from "./orm-config";

const main = async () => {
  // initialize TypeORM
  await dataSource.initialize();

  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  const redis = new Redis();
  const RedisStore = connectRedis(session);

  redis
    .on("error", (err) => console.error(`Redis error: ${err}`))
    .on("connect", () => console.info("Redis connected"));

  app.set("Access-Control-Allow-Origin", "https://studio.apollographql.com");
  app.set("Access-Control-Allow-Credentials", true);

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis as any,
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
      origin: "http://localhost:3000",
      credentials: true
    }),
    bodyParser.json({ limit: "50mb" }),
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => ({ req, res, redis })
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 6380 }, resolve)
  );

  console.log(`🚀 Server ready at http://localhost:6380/`);
};

main().catch((err) => console.error(err));
