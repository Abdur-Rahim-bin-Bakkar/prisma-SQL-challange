import prisma from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";

const CART_INCLUDE = {
  product: {
    include: { category: true },
  },
} as const;

export async function getCart(userId: string) {
  const items = await prisma.cart.findMany({
    where: { userId, product: { isDeleted: false } },
    include: CART_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  const total = items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  return { items, total };
}

export async function addToCart(userId: string, productId: string, quantity = 1) {
  if (!productId) {
    throw new AppError(400, "Product is required.");
  }
  const qty = Math.max(Number(quantity) || 1, 1);

  const product = await prisma.product.findFirst({ where: { id: productId, isDeleted: false } });
  if (!product) {
    throw new AppError(404, "Product not found.");
  }
  if (product.stock <= 0) {
    throw new AppError(400, "This product is out of stock.");
  }

  const existing = await prisma.cart.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    const updated = await prisma.cart.update({
      where: { id: existing.id },
      data: { quantity: Math.min(existing.quantity + qty, product.stock) },
      include: CART_INCLUDE,
    });
    return { item: updated, added: false };
  }

  const item = await prisma.cart.create({
    data: { userId, productId, quantity: Math.min(qty, product.stock) },
    include: CART_INCLUDE,
  });
  return { item, added: true };
}

export async function updateCartItem(userId: string, cartItemId: string, quantity: number) {
  const qty = Math.max(Number(quantity) || 1, 1);

  const item = await prisma.cart.findFirst({ where: { id: cartItemId, userId } });
  if (!item) {
    throw new AppError(404, "Cart item not found.");
  }

  const product = await prisma.product.findFirst({ where: { id: item.productId, isDeleted: false } });
  if (!product) {
    throw new AppError(404, "Product not found.");
  }

  const updated = await prisma.cart.update({
    where: { id: item.id },
    data: { quantity: Math.min(qty, product.stock) },
    include: CART_INCLUDE,
  });
  return updated;
}

export async function removeFromCart(userId: string, cartItemId: string) {
  const item = await prisma.cart.findFirst({ where: { id: cartItemId, userId } });
  if (!item) {
    throw new AppError(404, "Cart item not found.");
  }
  await prisma.cart.delete({ where: { id: item.id } });
}
