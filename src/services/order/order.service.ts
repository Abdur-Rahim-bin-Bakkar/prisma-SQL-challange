import prisma from "../../lib/prisma";
import { AppError } from "../../lib/app-error";
import { createCrudService, pick, type PrismaDelegate } from "../../lib/crud-factory";

const orderCrud = createCrudService(prisma.order as unknown as PrismaDelegate, {
  include: { user: true },
  orderBy: { createdAt: "desc" },
});

const UPDATABLE_FIELDS = ["status"];

function validate(data: Record<string, unknown>) {
  if (data.total === undefined || typeof data.total !== "number" || data.total < 0) {
    throw new AppError(400, "Total must be a non-negative number.");
  }
  const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (data.status && typeof data.status === "string" && !statuses.includes(data.status)) {
    throw new AppError(400, `Status must be one of: ${statuses.join(", ")}.`);
  }
}

export async function createOrder(userId: string, data: Record<string, unknown>) {
  validate(data);
  return orderCrud.create({ ...data, userId });
}

export async function getOrders(userId: string, role: string, query: { page?: number; limit?: number; search?: string }) {
  const crud = createCrudService(prisma.order as unknown as PrismaDelegate, {
    include: { user: true },
    orderBy: { createdAt: "desc" },
    filter: role === "Admin" ? undefined : () => ({ userId }),
  });
  return crud.getAll(query);
}

export async function getOrderById(userId: string, role: string, id: string) {
  const order = await orderCrud.getById(id);
  if (!order) {
    throw new AppError(404, "Order not found.");
  }
  if (order.userId !== userId && role !== "Admin") {
    throw new AppError(403, "You can only view your own orders.");
  }
  return order;
}

export async function updateOrder(userId: string, role: string, id: string, data: Record<string, unknown>) {
  await getOrderById(userId, role, id);
  if (role !== "Admin") {
    throw new AppError(403, "Only admins can update orders.");
  }
  return orderCrud.update(id, pick(data, UPDATABLE_FIELDS));
}

export async function softDeleteOrder(userId: string, role: string, id: string) {
  await getOrderById(userId, role, id);
  if (role !== "Admin") {
    throw new AppError(403, "Only admins can delete orders.");
  }
  return orderCrud.softDelete(id);
}
