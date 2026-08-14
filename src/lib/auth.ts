import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "surya-power-erp-super-secret-jwt-key-2026-production"
);

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF" | "ACCOUNTANT";
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function signJWT(payload: UserPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<UserPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as UserPayload;
  } catch (err) {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<UserPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const cookieToken = req.cookies.get("token")?.value;
    if (!cookieToken) return null;
    return await verifyJWT(cookieToken);
  }
  const token = authHeader.substring(7);
  return await verifyJWT(token);
}
