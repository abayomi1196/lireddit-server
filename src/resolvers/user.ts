import { Arg, Ctx, Field, InputType, Mutation, Resolver } from "type-graphql";
import argon from "argon2";

import { User } from "../entities/User";
import { MyContext } from "src/types";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@Resolver()
export class UserResolver {
  @Mutation(() => User)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ) {
    const hashedPassword = await argon.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await em.persistAndFlush(user);
    return user;
  }
}
