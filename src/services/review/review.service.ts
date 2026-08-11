import prisma from "../../lib/prisma";
import { AppError } from "../../lib/app-error";
import { createCrudService, pick, type PrismaDelegate } from "../../lib/crud-factory";

const reviewCrud = createCrudService(prisma.review as unknown as PrismaDelegate, {
  include: {
    user: { select: { id: true, name: true, email: true, image: true, role: true } },
    product: { select: { id: true, title: true, image: true, price: true } },
  },
  orderBy: { createdAt: "desc" },
});

const UPDATABLE_FIELDS = ["rating", "comment"];

function validate(data: Record<string, unknown>) {
  if (data.rating === undefined || typeof data.rating !== "number" || data.rating < 1 || data.rating > 5) {
    throw new AppError(400, "Rating must be a number between 1 and 5.");
  }
}

export async function createReview(userId: string, data: Record<string, unknown>) {
  validate(data);
  if (!data.productId) {
    throw new AppError(400, "Product id is required.");
  }

  const product = await prisma.product.findFirst({
    where: { id: data.productId as string, isDeleted: false },
  });
  if (!product) {
    throw new AppError(404, "Product not found.");
  }

  return reviewCrud.create({ ...data, userId });
}

export async function getReviews(query: { page?: number; limit?: number; search?: string }) {
  return reviewCrud.getAll(query);
}

export async function getReviewById(id: string) {
  const review = await reviewCrud.getById(id);
  if (!review) {
    throw new AppError(404, "Review not found.");
  }
  return review;
}

export async function updateReview(userId: string, role: string, id: string, data: Record<string, unknown>) {
  const review = await getReviewById(id);
  if (review.userId !== userId && role !== "Admin") {
    throw new AppError(403, "You can only update your own reviews.");
  }
  return reviewCrud.update(id, pick(data, UPDATABLE_FIELDS));
}

export async function softDeleteReview(userId: string, role: string, id: string) {
  const review = await getReviewById(id);
  if (review.userId !== userId && role !== "Admin") {
    throw new AppError(403, "You can only delete your own reviews.");
  }
  return reviewCrud.softDelete(id);
}
