import bcrypt from "bcryptjs";
import { authRepository } from "./auth.repository.js";
import { generateToken } from "../../utils/jwt.js";
import { ConflictError, UnauthorizedError } from "../../errors/AppError.js";
import type { SignupInput, LoginInput } from "./auth.validators.js";
import type { User } from "../../db/schema/users.schema.js";

function toPublicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email };
}

export const authService = {
  async signup(input: SignupInput) {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) throw new ConflictError("A user with this email already exists");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await authRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const token = generateToken({ id: user.id, email: user.email });
    return { token, user: toPublicUser(user) };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email);
    // Same error for "no such user" and "wrong password" to avoid user enumeration.
    if (!user) throw new UnauthorizedError("Invalid email or password");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    const token = generateToken({ id: user.id, email: user.email });
    return { token, user: toPublicUser(user) };
  },
};
