import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver
} from "type-graphql";
import argon from "argon2";

//@ts-ignore
import session from "express-session";

import { User } from "../entities/User";
import { MyContext } from "src/types";
import { COOKIE_NAME } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";

declare module "express-session" {
  export interface SessionData {
    userId: number;
  }
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  // @Mutation(() => Boolean)
  // async forgotPassword(@Arg("email") email: string, @Ctx() { em }: MyContext) {
  //   // const user = await em.findOne(User, { email });
  //   return true;
  // }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    if (!req.session.userId) {
      // you are not logged in
      return null;
    }

    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      email: options.email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    try {
      await em.persistAndFlush(user);
    } catch (err) {
      if (err.code === "23505") {
        // duplicate username error
        return {
          errors: [
            {
              field: "username",
              message: "username has already been taken"
            }
          ]
        };
      }
      console.log("message: ", err);
    }

    // store user id in session
    //this will set a cookie for the user, & keep them logged in
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );

    if (!user) {
      return {
        errors: [
          { field: "usernameOrEmail", message: "that username does not exist" }
        ]
      };
    }

    const isValidPassword = await argon.verify(user.password, password);

    if (!isValidPassword) {
      return {
        errors: [{ field: "password", message: "incorrect password" }]
      };
    }

    req.session.userId = user.id;

    return {
      user
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);

        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
