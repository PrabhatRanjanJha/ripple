import jwt from "jsonwebtoken";

export function getCookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

export default function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "change_me", {
    expiresIn: "7d",
  });
}
