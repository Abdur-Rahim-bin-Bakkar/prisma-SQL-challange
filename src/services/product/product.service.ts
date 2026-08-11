import prisma from "../../lib/prisma";
import { AppError } from "../../lib/app-error";
import { createCrudService, pick, type PrismaDelegate } from "../../lib/crud-factory";

const productCrud = createCrudService(prisma.product as unknown as PrismaDelegate, {
  searchableFields: ["title", "description"],
  include: { category: true, reviews: true },
  orderBy: { createdAt: "desc" },
});

const UPDATABLE_FIELDS = ["title", "description", "price", "stock", "image", "categoryId", "status"];

function validate(data: Record<string, unknown>) {
  if (!data.title || typeof data.title !== "string") {
    throw new AppError(400, "Product title is required.");
  }
  if (data.price === undefined || data.price === null) {
    throw new AppError(400, "Product price is required.");
  }
  if (typeof data.price !== "number" || data.price < 0) {
    throw new AppError(400, "Price must be a positive number.");
  }
  if (data.stock !== undefined && (typeof data.stock !== "number" || data.stock < 0)) {
    throw new AppError(400, "Stock must be a non-negative number.");
  }
  const statuses = ["DRAFT", "ACTIVE", "ARCHIVED"];
  if (data.status && typeof data.status === "string" && !statuses.includes(data.status)) {
    throw new AppError(400, `Status must be one of: ${statuses.join(", ")}.`);
  }
}

export async function createProduct(data: Record<string, unknown>) {
  validate(data);
  if (data.categoryId) {
    const category = await prisma.category.findFirst({ where: { id: data.categoryId as string, isDeleted: false } });
    if (!category) {
      throw new AppError(400, "The provided category does not exist.");
    }
  }
  return productCrud.create(data);
}

export async function getProducts(query: { page?: number; limit?: number; search?: string }) {
  return productCrud.getAll(query);
}

export async function getProductById(id: string) {
  const product = await productCrud.getById(id);
  if (!product) {
    throw new AppError(404, "Product not found.");
  }
  return product;
}

export async function updateProduct(id: string, data: Record<string, unknown>) {
  await getProductById(id);
  return productCrud.update(id, pick(data, UPDATABLE_FIELDS));
}

export async function softDeleteProduct(id: string) {
  await getProductById(id);
  return productCrud.softDelete(id);
}
