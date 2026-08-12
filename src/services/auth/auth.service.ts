import bcrypt from "bcryptjs";
import { randomBytes, scryptSync } from "node:crypto";
import prisma from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";
import { signToken } from "../../lib/jwt.js";

const SCRYPT_CONFIG = { N: 16384, r: 16, p: 1, dkLen: 64 };

function scryptHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, SCRYPT_CONFIG.dkLen, {
    N: SCRYPT_CONFIG.N,
    r: SCRYPT_CONFIG.r,
    p: SCRYPT_CONFIG.p,
    maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

function scryptVerify(hash: string, password: string) {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const target = scryptSync(password.normalize("NFKC"), salt, SCRYPT_CONFIG.dkLen, {
    N: SCRYPT_CONFIG.N,
    r: SCRYPT_CONFIG.r,
    p: SCRYPT_CONFIG.p,
    maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2,
  });
  return target.toString("hex") === key;
}

async function getCredentialAccount(userId: string) {
  return prisma.account.findFirst({
    where: { userId, providerId: "credential" },
  });
}

async function verifyPassword(user: { id: string; password: string | null }, password: string) {
  if (user.password) {
    return bcrypt.compare(password, user.password);
  }
  const account = await getCredentialAccount(user.id);
  if (!account?.password) {
    return false;
  }
  return scryptVerify(account.password, password);
}

function validateRegisterInput({ name, email, password }: { name?: string; email?: string; password?: string }) {
  if (!name || !email || !password) {
    throw new AppError(400, "Name, email and password are required.");
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(400, "Please provide a valid email address.");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new AppError(400, "Password must be at least 8 characters long.");
  }
}

export async function register({ name, email, password }: { name: string; email: string; password: string }) {
  validateRegisterInput({ name, email, password });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  await prisma.account.create({
    data: {
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: scryptHash(password),
    },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return { user: omitPassword(user), token };
}

export async function login({ email, password }: { email: string; password: string }) {
  if (!email || !password) {
    throw new AppError(400, "Email and password are required.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.isDeleted) {
    throw new AppError(401, "Invalid email or password.");
  }

  const valid = await verifyPassword(user, password);
  if (!valid) {
    throw new AppError(401, "Invalid email or password.");
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return { user: omitPassword(user), token };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, isDeleted: false } });
  if (!user) {
    throw new AppError(404, "User not found.");
  }
  return omitPassword(user);
}

export async function exchangeSessionToken(sessionToken: string) {
  if (!sessionToken) {
    throw new AppError(400, "Session token is required.");
  }

  const session = await prisma.session.findUnique({ where: { token: sessionToken } });
  if (!session || session.expiresAt < new Date()) {
    throw new AppError(401, "Invalid or expired session. Please log in again.");
  }

  const user = await prisma.user.findFirst({ where: { id: session.userId, isDeleted: false } });
  if (!user) {
    throw new AppError(401, "The user belonging to this session no longer exists.");
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return { user: omitPassword(user), token };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  if (!currentPassword || !newPassword) {
    throw new AppError(400, "Current and new password are required.");
  }
  if (newPassword.length < 8) {
    throw new AppError(400, "New password must be at least 8 characters long.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found.");
  }

  const valid = await verifyPassword(user, currentPassword);
  if (!valid) {
    throw new AppError(401, "Current password is incorrect.");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  const existingAccount = await getCredentialAccount(userId);
  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: scryptHash(newPassword) },
    });
  } else {
    await prisma.account.create({
      data: {
        accountId: userId,
        providerId: "credential",
        userId,
        password: scryptHash(newPassword),
      },
    });
  }

  return { message: "Password updated successfully." };
}

export function omitPassword<T extends { password?: string | null }>(user: T) {
  const { password: _password, ...rest } = user;
  return rest;
}
