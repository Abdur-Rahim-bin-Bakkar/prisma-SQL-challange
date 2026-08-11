import prisma from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes, scryptSync } from "node:crypto";
import { AppError } from "../../lib/app-error";
import { createCrudService, pick, type PrismaDelegate } from "../../lib/crud-factory";

const userCrud = createCrudService(prisma.user as unknown as PrismaDelegate, {
  searchableFields: ["name", "email"],
  include: { orders: true, reviews: true },
  orderBy: { createdAt: "desc" },
});

const UPDATABLE_FIELDS = ["name", "email", "image"];

function scryptHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

export async function createUser(data: Record<string, unknown>) {
  if (!data.name || !data.email || !data.password) {
    throw new AppError(400, "Name, email and password are required.");
  }
  const existing = await prisma.user.findUnique({ where: { email: String(data.email) } });
  if (existing) {
    throw new AppError(409, "A user with this email already exists.");
  }
  const hashed = await bcrypt.hash(String(data.password), 10);
  const user = (await userCrud.create({ name: data.name, email: data.email, password: hashed, image: data.image, role: data.role })) as { id: string };
  await prisma.account.create({
    data: {
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: scryptHash(String(data.password)),
    },
  });
  return user;
}

export async function getUsers(query: { page?: number; limit?: number; search?: string }) {
  return userCrud.getAll(query);
}

export async function getUserById(id: string) {
  const user = await userCrud.getById(id);
  if (!user) {
    throw new AppError(404, "User not found.");
  }
  const { password: _password, ...rest } = user;
  return rest;
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const user = await prisma.user.findFirst({ where: { id, isDeleted: false } });
  if (!user) {
    throw new AppError(404, "User not found.");
  }
  return userCrud.update(id, pick(data, UPDATABLE_FIELDS));
}

export async function softDeleteUser(id: string) {
  const user = await prisma.user.findFirst({ where: { id, isDeleted: false } });
  if (!user) {
    throw new AppError(404, "User not found.");
  }
  return userCrud.softDelete(id);
}
