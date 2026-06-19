import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev_secret";

export function generateToken(user: any) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    SECRET,
    { expiresIn: "7d" }
  );
}