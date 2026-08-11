import prisma from "../../lib/prisma";
import { AppError } from "../../lib/app-error";
import { createCrudService, pick, type PrismaDelegate } from "../../lib/crud-factory";
import { slugify } from "../../lib/slugify";

const categoryCrud = createCrudService(prisma.category as unknown as PrismaDelegate, {
  searchableFields: ["name", "slug"],
  include: { products: true },
  orderBy: { createdAt: "desc" },
});

const UPDATABLE_FIELDS = ["name", "slug", "description", "status"];

function validate(data: Record<string, unknown>) {
  if (!data.name || typeof data.name !== "string") {
    throw new AppError(400, "Category name is required.");
  }
  const statuses = ["DRAFT", "ACTIVE", "ARCHIVED"];
  if (data.status && typeof data.status === "string" && !statuses.includes(data.status)) {
    throw new AppError(400, `Status must be one of: ${statuses.join(", ")}.`);
  }
}

export async function createCategory(data: Record<string, unknown>) {
  validate(data);
  const slug = data.slug ? String(data.slug) : slugify(String(data.name));
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    throw new AppError(409, "A category with this slug already exists.");
  }
  return categoryCrud.create({ ...data, slug });
}

export async function getCategories(query: { page?: number; limit?: number; search?: string }) {
  return categoryCrud.getAll(query);
}

export async function getCategoryById(id: string) {
  const category = await categoryCrud.getById(id);
  if (!category) {
    throw new AppError(404, "Category not found.");
  }
  return category;
}

export async function updateCategory(id: string, data: Record<string, unknown>) {
  await getCategoryById(id);
  const updated = pick(data, UPDATABLE_FIELDS);
  if (data.name && !data.slug) {
    updated.slug = slugify(String(data.name));
  }
  if (updated.slug) {
    const conflict = await prisma.category.findFirst({ where: { slug: updated.slug as string, id: { not: id } } });
    if (conflict) {
      throw new AppError(409, "A category with this slug already exists.");
    }
  }
  return categoryCrud.update(id, updated);
}

export async function softDeleteCategory(id: string) {
  await getCategoryById(id);
  return categoryCrud.softDelete(id);
}
