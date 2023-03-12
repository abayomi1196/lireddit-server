import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "Invalid email"
      }
    ];
  }

  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "username cannot include an @ sign"
      }
    ];
  }

  if (options.username.length <= 2) {
    return [
      {
        field: "username",
        message: "username's length must be greater than 2"
      }
    ];
  }

  if (options.password.length <= 2) {
    return [
      {
        field: "password",
        message: "password's length must be greater than 2"
      }
    ];
  }

  return null;
};
